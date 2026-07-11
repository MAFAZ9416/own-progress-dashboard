# Contributing to Progressly

Welcome! Thank you for contributing to the Progressly Admin Dashboard.

## Code Standards
- **Python/Django**: Adhere to PEP 8 standards. Use Django best practices for querysets (`select_related` and `prefetch_related` where appropriate).
- **React/JS**: Write modular, presentation-focused UI elements. Separate state management from rendering components.
- **Responsiveness**: Ensure all tables fallback gracefully to list-cards on screen widths under 768px (using `AdminMobileCard`).

## Pull Request Guidelines
1. Ensure all backend tests pass before opening a pull request:
   ```bash
   python manage.py test
   ```
2. Verify the production frontend builds successfully without warnings:
   ```bash
   npm run build
   ```
3. Do not check in active configurations (e.g. `.env` files).
