from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, F
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from skills.models import Skill
from tasks.models import Task, TaskCompletion
from streaks.models import Streak
from analytics.models import Achievement, UserAchievement, Activity
from analytics.achievement_service import seed_default_achievements


class DashboardSummaryView(APIView):
    """
    API View for retrieving dashboard summary data.

    Returns aggregated metrics for the authenticated user:
    - Total skills / tasks / completed / pending counts
    - **Dynamically computed** current and longest streaks
    - Active days in the current week (for the streak widget)

    Streaks are derived from distinct ``TaskCompletion.completed_date``
    values for accuracy. The cached ``Streak`` model is read (not written)
    on this endpoint to preserve historical longest-streak records.

    Authentication: Required (IsAuthenticated)
    HTTP Methods: GET
    """
    permission_classes = [IsAuthenticated]

    # ── helpers ────────────────────────────────────────────────────
    @staticmethod
    def _compute_streaks(active_dates):
        """
        Given a **sorted ascending** list of ``datetime.date`` objects,
        return ``(current_streak, longest_streak)``.

        Rules:
        - Consecutive active days form a streak.
        - Missing one day resets the streak.
        - ``current_streak`` counts only if the chain reaches today
          (or yesterday, so you don't lose the streak mid-day).
        """
        from django.utils import timezone as tz

        if not active_dates:
            return 0, 0

        today = tz.now().date()

        # Walk backwards to compute current streak
        current = 0
        check = today
        for d in reversed(active_dates):
            if d == check:
                current += 1
                check -= timedelta(days=1)
            elif d < check:
                # Allow "yesterday counts" — the user hasn't had a chance
                # to be active today yet, so look one day earlier on first
                # iteration only.
                if current == 0 and d == today - timedelta(days=1):
                    current = 1
                    check = d - timedelta(days=1)
                else:
                    break

        # Walk forward once to compute longest streak
        longest = 1
        run = 1
        for i in range(1, len(active_dates)):
            if active_dates[i] == active_dates[i - 1] + timedelta(days=1):
                run += 1
                longest = max(longest, run)
            elif active_dates[i] != active_dates[i - 1]:
                run = 1

        return current, longest

    # ── GET ────────────────────────────────────────────────────────
    def get(self, request):
        user = request.user
        today = timezone.now().date()
        thirty_days_ago = today - timedelta(days=30)

        # Consolidated counts — one query per model instead of separate count() calls
        from django.db.models import Q
        skill_stats = Skill.objects.filter(user=user).aggregate(
            total=Count('id'),
            recent=Count('id', filter=Q(created_at__gte=thirty_days_ago)),
        )
        task_stats = Task.objects.filter(user=user).aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='completed')),
            pending=Count('id', filter=Q(status__in=['todo', 'pending'])),
            in_progress=Count('id', filter=Q(status='in_progress')),
            recent=Count('id', filter=Q(created_at__gte=thirty_days_ago)),
        )
        total_skills = skill_stats['total']
        total_tasks = task_stats['total']
        completed_tasks = task_stats['completed']
        pending_tasks = task_stats['pending']
        in_progress_tasks = task_stats['in_progress']
        skills_change = skill_stats['recent']
        tasks_change = task_stats['recent']

        # ── Dynamic streak calculation (single completion scan) ───
        active_dates = list(
            TaskCompletion.objects.filter(user=user)
            .values_list('completed_date', flat=True)
            .distinct()
            .order_by('completed_date')
        )
        current_streak, longest_streak = self._compute_streaks(active_dates)

        # Read cached longest streak; avoid write on read path
        streak_obj, _ = Streak.objects.get_or_create(user=user)
        longest_streak = max(longest_streak, streak_obj.longest_streak)

        streak_history = list(
            TaskCompletion.objects.filter(user=user)
            .values('completed_date')
            .annotate(count=Count('id'))
            .order_by('-completed_date')[:30]
        )

        unlocked_achievements = list(
            UserAchievement.objects.filter(user=user)
            .select_related('achievement')
            .order_by('-unlocked_at')[:10]
        )

        recent_activities = list(
            Activity.objects.filter(user=user)
            .order_by('-created_at')[:20]
        )

        seed_default_achievements()
        all_achievements = list(Achievement.objects.all().order_by('created_at'))

        completed_skill_count = Skill.objects.filter(user=user).annotate(
            completed_tasks_count=Count('tasks', filter=Q(tasks__status='completed'))
        ).filter(completed_tasks_count__gte=1).count()

        profile = getattr(user, 'profile', None)
        profile_score = 0
        suggestions = []
        if getattr(profile, 'avatar', None):
            profile_score += 20
        else:
            suggestions.append('Add an avatar to complete your profile')
        if getattr(profile, 'bio', ''):
            profile_score += 20
        else:
            suggestions.append('Add a bio to complete your profile')
        if getattr(profile, 'country', ''):
            profile_score += 20
        else:
            suggestions.append('Add your country to complete your profile')
        if total_skills > 0:
            profile_score += 20
        else:
            suggestions.append('Create your first skill')
        if total_tasks > 0:
            profile_score += 20
        else:
            suggestions.append('Create your first task')

        profile_score = min(profile_score, 100)

        # ── Active days in the current week (derived from active_dates) ──
        monday = today - timedelta(days=today.weekday())
        sunday = monday + timedelta(days=6)
        week_active = {d for d in active_dates if monday <= d <= sunday}
        day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        streak_active_days = [
            day_names[i]
            for i in range(7)
            if (monday + timedelta(days=i)) in week_active
        ]

        current_streak_trend = "active" if current_streak > 0 else "inactive"
        longest_streak_trend = "best"

        data = {
            "total_skills":       total_skills,
            "total_tasks":        total_tasks,
            "completed_tasks":    completed_tasks,
            "pending_tasks":      pending_tasks,
            "in_progress_tasks":   in_progress_tasks,
            "current_streak":     current_streak,
            "longest_streak":     longest_streak,
            "tasks_done":         completed_tasks,
            "streak_active_days": streak_active_days,
            "skills_change":      skills_change,
            "tasks_change":       tasks_change,
            "current_streak_trend": current_streak_trend,
            "longest_streak_trend": longest_streak_trend,
            "streak_history": streak_history,
            "recent_achievements": [
                {
                    'id': item.id,
                    'name': item.achievement.name,
                    'description': item.achievement.description,
                    'icon': item.achievement.icon,
                    'unlocked_at': item.unlocked_at,
                }
                for item in unlocked_achievements
            ],
            "achievements": [
                {
                    'id': achievement.id,
                    'name': achievement.name,
                    'description': achievement.description,
                    'icon': achievement.icon,
                    'unlocked': any(ua.achievement_id == achievement.id for ua in unlocked_achievements),
                }
                for achievement in all_achievements
            ],
            "recent_activities": [
                {
                    'id': item.id,
                    'action_type': item.action_type,
                    'message': item.message,
                    'metadata': item.metadata,
                    'created_at': item.created_at,
                }
                for item in recent_activities
            ],
            "profile_completion": profile_score,
            "profile_suggestions": suggestions,
        }

        return Response(data, status=status.HTTP_200_OK)


class SearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = (request.query_params.get('q') or '').strip()
        if not query:
            return Response({'results': []}, status=status.HTTP_200_OK)

        skills = Skill.objects.filter(user=request.user, name__icontains=query)[:10]
        tasks = Task.objects.filter(user=request.user, title__icontains=query)[:10]
        achievements = Achievement.objects.filter(name__icontains=query)[:10]

        results = []
        for skill in skills:
            results.append({'type': 'skill', 'id': skill.id, 'label': skill.name, 'path': '/skills'})
        for task in tasks:
            results.append({'type': 'task', 'id': task.id, 'label': task.title, 'path': '/tasks'})
        for achievement in achievements:
            results.append({'type': 'achievement', 'id': achievement.id, 'label': achievement.name, 'path': '/achievements'})

        return Response({'results': results[:20]}, status=status.HTTP_200_OK)


class ExportDataView(APIView):
    permission_classes = [IsAuthenticated]

    def perform_content_negotiation(self, request, force=False):
        from rest_framework.renderers import JSONRenderer
        return (JSONRenderer(), 'application/json')

    def get(self, request):
        export_format = (request.query_params.get('format') or 'json').lower()

        profile = getattr(request.user, 'profile', None)

        # ── Safe whitelisted export payload ─────────────────────────────────
        # ONLY export specified safe fields. NEVER export ids, email, passwords, tokens, staff status.
        skills_list = []
        for s in Skill.objects.filter(user=request.user):
            done_t = s.tasks.filter(status='completed').count()
            progress = min(round((done_t / s.target_tasks) * 100), 100) if s.target_tasks else 0
            skills_list.append({
                'name': s.name,
                'progress': progress,
                'level': s.level,
                'goal': s.goal_description or '',
            })

        tasks_list = []
        for t in Task.objects.filter(user=request.user):
            tasks_list.append({
                'title': t.title,
                'status': t.status,
                'priority': t.priority,
            })

        achievements_list = []
        for ua in UserAchievement.objects.filter(user=request.user).select_related('achievement'):
            achievements_list.append({
                'name': ua.achievement.name,
                'date_unlocked': str(ua.unlocked_at),
            })

        payload = {
            'profile': {
                'name': getattr(profile, 'full_name', '') or request.user.username or '',
                'bio': getattr(profile, 'bio', '') or '',
                'country': getattr(profile, 'country', '') or '',
            },
            'skills': skills_list,
            'tasks': tasks_list,
            'achievements': achievements_list,
        }

        if export_format == 'csv':
            import csv, io
            output = io.StringIO()
            writer = csv.writer(output)

            # Profile section
            writer.writerow(['section', 'field', 'value'])
            writer.writerow(['profile', 'name', payload['profile']['name']])
            writer.writerow(['profile', 'bio', payload['profile']['bio']])
            writer.writerow(['profile', 'country', payload['profile']['country']])

            # Skills section
            writer.writerow([])
            writer.writerow(['skills', 'name', 'progress', 'level', 'goal'])
            for skill in payload['skills']:
                writer.writerow(['skill', skill['name'], f"{skill['progress']}%", skill['level'], skill['goal']])

            # Tasks section
            writer.writerow([])
            writer.writerow(['tasks', 'title', 'status', 'priority'])
            for task in payload['tasks']:
                writer.writerow(['task', task['title'], task['status'], task['priority']])

            # Achievements section
            writer.writerow([])
            writer.writerow(['achievements', 'name', 'date_unlocked'])
            for ach in payload['achievements']:
                writer.writerow(['achievement', ach['name'], ach['date_unlocked']])

            csv_content = output.getvalue()
            response = HttpResponse(csv_content, content_type='text/csv; charset=utf-8')
            response['Content-Disposition'] = 'attachment; filename="progressly-export.csv"'
            response['Access-Control-Expose-Headers'] = 'Content-Disposition'
            return response

        return Response(payload, status=status.HTTP_200_OK)




class WeeklyAnalyticsView(APIView):
    """
    API View for retrieving weekly task completion analytics.
    
    Returns task completion counts aggregated by date for the last 7 days.
    Data is filtered only for the authenticated user.
    
    Uses Django ORM aggregation to group TaskCompletion records by date
    and count completed tasks per day.
    
    Authentication: Required (IsAuthenticated)
    HTTP Methods: GET
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retrieve weekly completion analytics for the authenticated user.
        
        Aggregates TaskCompletion records for the last 7 days, grouped by date,
        returning completion counts per day in chronological order.
        
        Response Example:
        [
            {
                "date": "2026-06-13",
                "completed_tasks": 2
            },
            {
                "date": "2026-06-14",
                "completed_tasks": 5
            }
        ]
        
        Args:
            request: HTTP request object containing authenticated user
            
        Returns:
            Response: List of objects with date and completed_tasks count
        """
        user = request.user
        
        # Calculate date range: last 7 days from today
        today = timezone.now().date()
        seven_days_ago = today - timedelta(days=6)
        
        # Query TaskCompletion records for the user within last 7 days
        # Group by completed_date and count tasks per day
        weekly_data = TaskCompletion.objects.filter(
            user=user,
            completed_date__gte=seven_days_ago,
            completed_date__lte=today
        ).values('completed_date').annotate(
            completed_tasks=Count('id')
        ).order_by('completed_date')
        
        # Format response data
        data = [
            {
                "date": str(item['completed_date']),
                "completed_tasks": item['completed_tasks']
            }
            for item in weekly_data
        ]
        
        return Response(data, status=status.HTTP_200_OK)


class MonthlyAnalyticsView(APIView):
    """
    API View for retrieving monthly task completion analytics.

    Returns task completion counts aggregated **by calendar month** for a
    given year.  Accepts an optional ``?year=`` query parameter (defaults
    to the current year).

    The response also includes an ``available_years`` list so the
    frontend can render a year-selector dropdown.

    Authentication: Required (IsAuthenticated)
    HTTP Methods: GET
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retrieve monthly completion analytics for the authenticated user.

        Query params:
            year (int, optional) – calendar year to report on.
                                   Defaults to the current year.

        Response Example:
        {
            "year": 2026,
            "available_years": [2025, 2026],
            "months": [
                { "month": 1, "completed_tasks": 12 },
                { "month": 6, "completed_tasks": 6 }
            ]
        }

        Args:
            request: HTTP request object containing authenticated user

        Returns:
            Response: Object with year, available_years, and months list
        """
        from datetime import date
        from django.db.models.functions import ExtractMonth, ExtractYear

        user = request.user
        current_year = timezone.now().year

        # Parse requested year, default to current
        try:
            year = int(request.query_params.get('year', current_year))
        except (TypeError, ValueError):
            year = current_year

        year_start = date(year, 1, 1)
        year_end = date(year, 12, 31)

        # Range filter uses composite index on (user, completed_date)
        monthly_data = (
            TaskCompletion.objects.filter(
                user=user,
                completed_date__gte=year_start,
                completed_date__lte=year_end,
            )
            .annotate(month=ExtractMonth('completed_date'))
            .values('month')
            .annotate(completed_tasks=Count('id'))
            .order_by('month')
        )

        months = [
            {
                "month": item['month'],
                "completed_tasks": item['completed_tasks'],
            }
            for item in monthly_data
        ]

        # Distinct years that have any completion data for the user
        available_years = sorted(
            TaskCompletion.objects.filter(user=user)
            .annotate(yr=ExtractYear('completed_date'))
            .values_list('yr', flat=True)
            .distinct()
        )

        # Guarantee the current year is always selectable
        if current_year not in available_years:
            available_years.append(current_year)
            available_years.sort()

        return Response(
            {
                "year": year,
                "available_years": available_years,
                "months": months,
            },
            status=status.HTTP_200_OK,
        )


class RecentActivityView(APIView):
    """
    API View for retrieving recent task completion activity.
    
    Returns the latest 20 task completions for the authenticated user.
    Includes task name, skill name, and completion timestamp.
    Results are ordered by most recent first.
    
    Uses select_related() for efficient querying of related Task and Skill objects.
    
    Authentication: Required (IsAuthenticated)
    HTTP Methods: GET
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retrieve recent task completion activity for the authenticated user.
        
        Fetches the latest 20 TaskCompletion records ordered by completion time,
        including associated task and skill information.
        
        Response Example:
        [
            {
                "task": "Learn DRF",
                "skill": "Python",
                "completed_at": "2026-06-19T14:30:00Z"
            },
            {
                "task": "Build API",
                "skill": "Django",
                "completed_at": "2026-06-19T10:15:00Z"
            }
        ]
        
        Args:
            request: HTTP request object containing authenticated user
            
        Returns:
            Response: List of objects with task, skill, and completed_at
        """
        user = request.user
        
        # Query latest 20 TaskCompletion records for the user
        # Use select_related() to fetch related Task and Skill objects efficiently
        # Order by completed_at descending (newest first)
        recent_completions = TaskCompletion.objects.filter(
            user=user
        ).select_related('task', 'skill').order_by('-completed_at')[:20]
        
        # Format response data
        data = [
            {
                "task": completion.task.title,
                "skill": completion.skill.name,
                "completed_at": completion.completed_at.isoformat()
            }
            for completion in recent_completions
        ]
        
        return Response(data, status=status.HTTP_200_OK)


class HeatmapAnalyticsView(APIView):
    """
    API View for retrieving heatmap-style task completion counts.

    Returns completion counts grouped by date for the last 365 days.
    Data is filtered only for the authenticated user.

    Uses Django ORM aggregation to group TaskCompletion records by date
    and count completions per day.

    Authentication: Required (IsAuthenticated)
    HTTP Methods: GET
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retrieve heatmap analytics for the authenticated user.

        Aggregates TaskCompletion records for the last 365 days, grouped by date,
        returning daily completion counts in chronological order.

        Response Example:
        [
            {
                "date": "2026-01-10",
                "count": 4
            }
        ]

        Args:
            request: HTTP request object containing authenticated user

        Returns:
            Response: List of objects with date and count
        """
        user = request.user

        today = timezone.now().date()
        one_year_ago = today - timedelta(days=364)

        heatmap_data = TaskCompletion.objects.filter(
            user=user,
            completed_date__gte=one_year_ago,
            completed_date__lte=today
        ).values('completed_date').annotate(
            count=Count('id')
        ).order_by('completed_date')

        data = [
            {
                "date": str(item['completed_date']),
                "count": item['count']
            }
            for item in heatmap_data
        ]

        return Response(data, status=status.HTTP_200_OK)


class AchievementsView(APIView):
    """
    Dedicated achievements endpoint.
    Returns all achievements with per-user unlock status,
    unlock date, and contextual progress hints.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from analytics.achievement_service import seed_default_achievements
        from tasks.models import Task
        from skills.models import Skill
        from streaks.models import Streak

        user = request.user
        seed_default_achievements()

        all_achievements = Achievement.objects.all().order_by('created_at')
        user_unlocked = {
            ua.achievement_id: ua
            for ua in UserAchievement.objects.filter(user=user).select_related('achievement')
        }

        # Compute progress context once
        total_skills = Skill.objects.filter(user=user).count()
        completed_tasks = Task.objects.filter(user=user, status='completed').count()
        streak_obj = Streak.objects.filter(user=user).first()
        current_streak = streak_obj.current_streak if streak_obj else 0

        results = []
        for achievement in all_achievements:
            ua = user_unlocked.get(achievement.id)
            unlocked = ua is not None

            # Build progress hint
            cond = achievement.condition
            if 'skills_created' in cond:
                progress_val = total_skills
                progress_max = 1
            elif 'completed_tasks >= 50' in cond:
                progress_val = min(completed_tasks, 50)
                progress_max = 50
            elif 'completed_tasks >= 100' in cond:
                progress_val = min(completed_tasks, 100)
                progress_max = 100
            elif 'current_streak' in cond:
                progress_val = min(current_streak, 7)
                progress_max = 7
            elif 'skill_progress' in cond:
                # Check if any skill is at 100% by comparing done tasks vs target
                from django.db.models import Count, Q
                mastered = Skill.objects.filter(user=user).annotate(
                    done=Count('tasks', filter=Q(tasks__status='completed'))
                ).filter(done__gte=F('target_tasks'), target_tasks__gt=0).count()
                progress_val = 1 if mastered > 0 else 0
                progress_max = 1
            else:
                progress_val = 1 if unlocked else 0
                progress_max = 1

            progress_pct = min(100, int((progress_val / max(progress_max, 1)) * 100))

            results.append({
                'id': achievement.id,
                'name': achievement.name,
                'description': achievement.description,
                'icon': achievement.icon,
                'condition': achievement.condition,
                'unlocked': unlocked,
                'unlocked_at': ua.unlocked_at if ua else None,
                'progress_pct': progress_pct,
                'progress_val': progress_val,
                'progress_max': progress_max,
            })

        return Response({'achievements': results}, status=status.HTTP_200_OK)


class ActivityFeedView(APIView):
    """Paginated activity timeline for the authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit = min(int(request.query_params.get('limit', 30)), 100)
        activities = Activity.objects.filter(user=request.user).order_by('-created_at')[:limit]
        data = [
            {
                'id': item.id,
                'action_type': item.action_type,
                'message': item.message,
                'metadata': item.metadata,
                'created_at': item.created_at,
            }
            for item in activities
        ]
        return Response({'activities': data}, status=status.HTTP_200_OK)
