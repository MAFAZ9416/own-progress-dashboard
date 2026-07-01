# Deployment Instructions

This document details commands to deploy Progressly to staging and production.

---

## 🐍 Backend Deployments

1. Run Django static asset collections:
   ```bash
   python manage.py collectstatic --noinput
   ```
2. Apply database schemas:
   ```bash
   python manage.py migrate --noinput
   ```
3. Launch with Gunicorn:
   ```bash
   gunicorn config.wsgi:application --bind 0.0.0.0:8000
   ```

---

## ⚡ Frontend Deployments

1. Build static output assets:
   ```bash
   npm run build
   ```
2. Serve the `dist/` directory using static hosting providers (Render, Vercel, Netlify).
