# Progressly Security Guidelines

This document details the authentication checks and backend safeguards implemented across the Progressly application.

---

## 🔐 Authentication Protocol

Admin endpoints are secured using JSON Web Tokens (JWT):
1. **Bearer Checks**: Incoming requests must include a JWT access token in the headers:
   ```http
   Authorization: Bearer <access_token>
   ```
2. **Permission Checks**: Endpoints are restricted to staff accounts using DRF's `IsAdminUser` permission class:
   ```python
   permission_classes = [IsAdminUser]
   ```

---

## 🛡️ Input Sanitization & Validation

- **SQL Injection Safeguards**: Queries are executed using Django ORM wrappers, which parameterized inputs automatically.
- **XSS & CSRF Handling**: Frontend communications utilize Axios API client configured to attach CRSF headers.
