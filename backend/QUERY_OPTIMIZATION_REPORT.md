# Phase 4 — Database Performance Optimization Report

**Project:** Progressly (`own-progress-dashboard`)  
**Date:** 2026-07-01  
**Method:** Django ORM audit + `benchmark_queries.py` query counting + full test suite

---

## Executive Summary

| Endpoint | Before | After | Reduction |
|----------|--------|-------|-----------|
| Dashboard summary | 8 | 4 | **−50%** |
| Skills list (5 skills) | 6 | 1 | **−83%** |
| Tasks list | 1 | 1 | Same count, now JOINs skill in one query |
| Monthly analytics | 2 | 2 | Same count, range filter + index-friendly |
| Login | 2* | 1 | **−50%** |
| Forgot password | 2* | 1 | **−50%** |
| Reset password (validate) | 2* | 1 | **−50%** |

\* Auth endpoints measured by code analysis before optimization; after values from `benchmark_queries.py`.

**All 29 backend tests pass.**

---

## Issues Found & Fixes Applied

### 1. N+1 — Skills list progress (`skills/views.py`, `skills/serializers.py`)

**Problem:** `SkillSerializer.get_progress()` called `obj.tasks.filter(status="completed").count()` per skill → N+1 COUNT queries.

**Fix:** Annotate completed task count on the queryset:

```python
Skill.objects.filter(user=...).annotate(
    completed_tasks_count=Count('tasks', filter=Q(tasks__status='completed'))
)
```

Serializer reads `obj.completed_tasks_count` with fallback for detail views.

---

### 2. Duplicate queries — Dashboard summary (`analytics/views.py`)

**Problems:**
- Separate `Skill.count()` + 30-day `Skill.count()` → merged into one `aggregate()`
- Separate `Task.aggregate()` + 30-day `Task.count()` → merged into one `aggregate()`
- Second `TaskCompletion` query for week active days → derived from first `active_dates` list in Python
- `Streak.save()` on every GET (write amplification) → removed; read cached `longest_streak` only

**Fix:** Reduced from 8 queries to 4:
1. Skill aggregate (total + 30-day)
2. Task aggregate (total + completed + pending + 30-day)
3. TaskCompletion distinct dates (streak + week widget)
4. Streak get_or_create (longest streak ceiling)

---

### 3. Duplicate queries — Auth flows (`users/serializers.py`, `users/views.py`)

| Flow | Before | After |
|------|--------|-------|
| Login | `User.objects.get()` + backend `get(email__iexact=)` | Single `authenticate(username=email)` |
| Forgot password | `exists()` + `get()` | Single `get(email__iexact=)` stored in serializer context |
| Reset password | Token fetched in serializer + view | Token fetched once in serializer, reused via context |

Added `select_related('profile')` / `select_related('user', 'user__profile')` where profile is accessed after lookup.

---

### 4. Unnecessary re-fetch — Task update (`tasks/views.py`)

**Problem:** `Task.objects.get(pk=serializer.instance.pk)` re-fetched row already in memory.

**Fix:** Compare against `serializer.instance` before `serializer.save()`.

---

### 5. Missing eager loading — Tasks (`tasks/views.py`)

**Problem:** Task list and completion paths accessed `task.skill` without prefetch.

**Fix:**
- `get_queryset()`: `.select_related("skill")`
- `CompleteTaskView` / `ReopenTaskView` / history endpoints: `get_object_or_404(Task.objects.select_related("skill"), ...)`

---

### 6. Suboptimal filter — Monthly analytics (`analytics/views.py`)

**Problem:** `completed_date__year=year` prevents efficient range index use.

**Fix:** `completed_date__gte=date(year, 1, 1)` and `completed_date__lte=date(year, 12, 31)`.

---

### 7. Missing indexes (migrations applied)

| Model | Index | Supports |
|-------|-------|----------|
| `Task` | `(user, status)` | Dashboard task stats, skill progress filter |
| `Task` | `(user, -created_at)` | Task list ordering |
| `TaskCompletion` | `(user, completed_date)` | Streak, heatmap, weekly/monthly analytics |
| `TaskCompletion` | `(user, -completed_at)` | Recent activity ordering |
| `Skill` | `(user, -created_at)` | Skill list ordering, 30-day counts |
| `PasswordResetToken` | `(user, is_used)` | Bulk token invalidation on reset |

Migrations:
- `skills/0002_skill_skills_skil_user_id_1ea1ee_idx.py`
- `tasks/0004_task_tasks_task_user_id_c0fce1_idx_and_more.py`
- `users/0005_passwordresettoken_users_passw_user_id_5ee9a9_idx.py`

---

## Already Optimized (No Changes Needed)

| Location | Technique |
|----------|-----------|
| `RecentActivityView` | `select_related('task', 'skill')` |
| `WeeklyAnalyticsView` | Single `values().annotate(Count)` |
| `HeatmapAnalyticsView` | Single grouped aggregation |
| `MonthlyAnalyticsView` available_years | Single distinct query (acceptable) |

---

## Remaining Recommendations (Future Phases)

1. **Streak source of truth** — `update_user_streak()` (incremental) vs dashboard full recompute from all completion dates can diverge. Consider one canonical streak service.
2. **`User.email` DB uniqueness** — App validates in Python; add `unique=True` or functional index for case-insensitive email.
3. **Profile N+1 on auth views** — JWT middleware loads user without `select_related('profile')`; custom user loader could reduce profile queries on register/delete/reset flows.
4. **`ReopenTaskView`** — Does not delete `TaskCompletion` (unlike `perform_update`); analytics drift, not a query issue.
5. **Admin panels** — Add `list_select_related` on `TaskCompletion` / `TaskActivity` admin to avoid `__str__` N+1.

---

## Measurement Reproduction

```powershell
cd backend
.\venv\Scripts\python.exe benchmark_queries.py
.\venv\Scripts\python.exe manage.py test
```

Benchmark script: `backend/benchmark_queries.py`  
Uses `django.db.connection.queries` with `DEBUG=True` (default in dev settings).

---

## Files Modified

- `analytics/views.py` — Dashboard consolidation, monthly range filter, read-only streak
- `skills/views.py` — `annotate(completed_tasks_count=...)`
- `skills/serializers.py` — Use annotated count
- `tasks/views.py` — `select_related`, remove redundant GET
- `users/serializers.py` — Single-query auth/reset flows
- `users/views.py` — Reuse serializer context objects
- `tasks/models.py`, `skills/models.py`, `users/models.py` — Composite indexes
- `benchmark_queries.py` — Query measurement utility (new)
