# Staging & Development Setup Instructions

This document outlines the local development setup for developers contributing to the Progressly codebase.

---

## 🐍 Backend Setup (Django)

1. Activate virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run migrations and check:
   ```bash
   python manage.py migrate
   python manage.py check
   ```
4. Start Django REST server:
   ```bash
   python manage.py runserver
   ```

---

## ⚡ Frontend Setup (React)

1. Install modules:
   ```bash
   npm install
   ```
2. Launch Vite dev server:
   ```bash
   npm run dev
   ```
