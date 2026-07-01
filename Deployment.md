# Progressly Production Deployment Guide

This document outlines the pipeline instructions for deploying the Django REST backend and React Vite frontend to production environments (such as Render, Heroku, AWS, or DigitalOcean VPS).

---

## 🐍 Backend Django Deployment

### 1. Collect Static Assets
Collect Django admin and rest framework default static files:
```bash
python manage.py collectstatic --noinput
```

### 2. Run Database Migrations
Apply PostgreSQL database schema changes:
```bash
python manage.py migrate --noinput
```

### 3. WSGI Server Configuration
Use Gunicorn to serve the WSGI process pool in production:
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

---

## ⚡ Frontend React Vite Deployment

### 1. Run Production Bundle
Build minified HTML/CSS/JS assets inside the `frontend/dist/` directory:
```bash
npm run build
```

### 2. Static Web Hosting
Deploy the contents of the `frontend/dist/` folder directly to static hosting platforms such as Vercel, Netlify, or AWS S3.
Ensure a routing rewrite rule is defined to redirect all paths back to `index.html` (since Vite compiles a Single Page Application):
- **Vercel** (`vercel.json`):
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- **Netlify** (`_redirects`):
  ```text
  /*    /index.html   200
  ```
