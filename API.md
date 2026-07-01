# Progressly Enterprise Admin APIs Documentation

This document describes REST API endpoints exposed under `/api/admin/` for console monitoring and configurations management.

---

## 🔐 Authentication Header

All requests to admin endpoints require a valid JSON Web Token (JWT) matching an account with `is_staff = True`.
```http
Authorization: Bearer <jwt_access_token>
```

---

## 📊 Dashboard Stats

Retrieve general telemetry, charts datasets, and registration statistics.

- **URL**: `/api/admin/stats/`
- **Method**: `GET`
- **Response Contracts**:
  ```json
  {
    "users": { "total": 12, "active": 10, "online": 2, "growth_pct": 5.4 },
    "tasks": { "total": 45, "completed": 30, "pending": 15, "completion_rate": 66.7 },
    "charts": {
      "registrations": [ { "date": "Jun 20", "count": 2 } ],
      "completions": [ { "date": "Jun 20", "completions": 4 } ],
      "streak_heatmap": [ { "date": "2026-06-20", "count": 2 } ]
    }
  }
  ```

---

## 🗄️ Database Monitor

Query table size indexing metrics and live PostgreSQL/Neon connections status.

- **URL**: `/api/admin/db-monitor/`
- **Method**: `GET`
- **Response Contracts**:
  ```json
  {
    "database_type": "PostgreSQL (Neon)",
    "database_version": "PostgreSQL 16.2",
    "active_connections": 4,
    "tables": [
      { "name": "tasks_task", "rows": 45, "size": "48 KB" }
    ]
  }
  ```

---

## 📨 Email Logs Console

Lists outgoing logs history, SMTP operational metrics, and retry failures.

- **URL**: `/api/admin/emails/`
- **Method**: `GET`
- **Query Params**: `?search=<str>&status=<delivered|failed>`
- **Retry Action**: `/api/admin/emails/<id>/retry/` (`POST`)
