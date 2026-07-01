# Progressly Enterprise Architecture Overview

This document describes the design patterns, code modularity rules, and folder structure layouts implemented in the Progressly application.

---

## 🗂️ Project Directory Tree

```
own-progress-dashboard/
├── backend/
│   ├── admin_panel/         # Admin views, urls, audit logs, db monitor, backups
│   ├── config/              # Django settings, root URLs, WSGI
│   └── users/               # JWT authentication, user accounts, profiles
└── frontend/
    └── src/
        ├── admin/           # Refactored Admin module
        │   ├── components/  # StatCard, SkeletonLoader, TabTransition
        │   └── views/       # Dashboard, Users, Skills, Tasks, Streaks views
        ├── pages/
        │   ├── Admin.jsx    # Master Orchestrator (Tab controller, search, state)
        │   └── Dashboard.jsx
        └── routes/
            └── AppRoutes.jsx # Client side react routing tables
```

---

## 🏗️ Design Principles

### 1. Frontend Modular Separation (Phase 2 Refactor)
- **Controller Layer**: [Admin.jsx](file:///c:/Users/mafaz/OneDrive/Desktop/own-progress-dashboard/frontend/src/pages/Admin.jsx) handles master rendering logic, modal states, network syncing callbacks, and notifications.
- **Views Layer**: Components inside `src/admin/views/` (e.g. `ManagementViews`, `SystemViews`) are clean presentational layers that consume state via props and dispatch actions.
- **Shared Components**: `src/admin/components/` defines standardized reusable units (Skeletons, Transition containers).

### 2. Backend Clean Separation (Phase 3 Refactor)
- Views authenticate request permissions via `IsAdminUser` JWT middlewares.
- Business logic (logging activities, dumping fixtures, checking server uptime) is handled inside services.
- Database queries use `select_related()` and `prefetch_related()` annotations to fetch profiles and relationship tables in single operations.
