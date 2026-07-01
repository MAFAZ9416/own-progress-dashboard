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

# ─── SMTP Server settings ───
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=mafaz9416@gmail.com
EMAIL_HOST_PASSWORD=your-google-app-password
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

## 📧 SMTP Client Credentials

If using Gmail:
1. Enable **Two-Factor Authentication (2FA)** on your Google account.
2. Navigate to security, create an **App Password**, and use that string as `EMAIL_HOST_PASSWORD` (do not use your raw login credentials).
