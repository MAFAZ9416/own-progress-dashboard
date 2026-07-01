# Progressly Enterprise Clean Architecture

This document describes the design patterns, code modularity rules, and package structures implemented in the Progressly application.

---

## 🗂️ Clean Folder Structure (V2.1 Refactor)

```
own-progress-dashboard/
├── backend/
│   ├── admin_panel/
│   │   ├── api/             # Standardized REST endpoint views
│   │   ├── serializers/     # Django REST Framework serializers
│   │   ├── services/        # Centralized business logic functions
│   │   └── views/           # Controller endpoints
│   ├── config/              # WSGI & routing tables
│   └── users/               # JWT authentication
└── frontend/
    └── src/
        ├── admin/
        │   ├── components/  # StatCard, SkeletonLoader, and transition containers
        │   ├── constants/   # Color themes & configs
        │   └── pages/       # Fully isolated feature views (Dashboard, Users, etc.)
        └── pages/
            └── Admin.jsx    # Master SPA orchestrator controller
```

---

## 🏗️ Refactoring Principles

### 1. Presentation & Controller Separation (Frontend)
- **Master Controller**: [Admin.jsx](file:///c:/Users/mafaz/OneDrive/Desktop/own-progress-dashboard/frontend/src/pages/Admin.jsx) handles synchronization, global search indices, and switching views.
- **Presentational Views**: Located in `src/admin/pages/`, each sub-view is fully decoupled, receiving reactive state data through props.

### 2. Business Logic Delegation (Backend)
- All database mutations and transaction logic (e.g. logging activity records) are delegated to service files inside `services/`.
- Views inside `views/` are lightweight connectors that process input variables and pass operations to backend serializers.
