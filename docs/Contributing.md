# Code Conventions & Contribution Standards

This document describes coding standards for committing changes to the Progressly project.

---

## 🎨 Frontend Coding Standards (React 19)

- **Modularity**: Every view must reside inside its own folder under `src/admin/pages/`.
- **Reusable Elements**: Put shared visual components (e.g. StatCard) in `src/admin/components/`.
- **Imports**: Separate third-party dependencies from local features.

---

## 🐍 Backend Coding Standards (Django REST)

- **Views**: Keep views thin. Business actions must go to `services/`.
- **Query Optimization**: Always prefetch related tables using `select_related()` or `prefetch_related()`.
