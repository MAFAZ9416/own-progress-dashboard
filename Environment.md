# Progressly Environment Configurations Guide

This document details all configuration variables, credentials, and settings needed to boot and execute the Progressly application in both local development and live production setups.

---

## 🔑 Environment Variables (.env)

Create a `.env` file in the `backend/` directory with the following variables:

```bash
# ─── Django Core settings ───
SECRET_KEY=your-django-secure-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# ─── Neon PostgreSQL credentials ───
DATABASE_URL=postgresql://<user>:<password>@<neon-endpoint>.neon.tech/<db-name>?sslmode=require

# ─── Email settings ───
DEFAULT_FROM_EMAIL=mafaz9416@gmail.com

# ─── JWT Authentication configs ───
JWT_ACCESS_EXPIRATION_MINUTES=60
JWT_REFRESH_EXPIRATION_DAYS=7
```

---

## 🗄️ Neon PostgreSQL SSL Settings

Neon PostgreSQL forces SSL encryption by default. Ensure the connection string includes `?sslmode=require` to prevent handshaking drops:
```
postgresql://mafaz_owner:***@ep-***.us-east-2.aws.neon.tech/progressly?sslmode=require
```

---

## 📧 Email Client Credentials
Email delivery is currently processed via a local placeholder service. Live SMTP or third-party client integrations are disabled during this reset phase.
