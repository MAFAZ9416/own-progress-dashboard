# Admin REST APIs Specification

Progressly exposes telemetry and audit endpoints under `/api/admin/`:

---

## 📊 Summary Stats
- **URL**: `/api/admin/stats/`
- **Method**: `GET`
- **Purpose**: Sourced user growth, task completion metrics, and streak calendar lists.

---

## 🗄️ Database Monitor
- **URL**: `/api/admin/db-monitor/`
- **Method**: `GET`
- **Purpose**: Query row counts, sizes, and Neon PG connections.

---

## ✉️ Email Logs
- **URL**: `/api/admin/emails/`
- **Method**: `GET`
- **Retry Action**: `/api/admin/emails/<id>/retry/` (`POST`)
- **Purpose**: List email details, and trigger sending retries.
