# Environment Configurations

This document details credentials and setup variables for executing Progressly locally and in production.

---

## ⚙️ Backend Configurations (.env)

Create a `.env` file in the `backend/` directory:

```bash
SECRET_KEY=django-secure-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# Neon PostgreSQL connection string
DATABASE_URL=postgresql://<user>:<password>@<endpoint>.neon.tech/<db>?sslmode=require

# SMTP configuration details
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=mafaz9416@gmail.com
EMAIL_HOST_PASSWORD=google-app-password
```
