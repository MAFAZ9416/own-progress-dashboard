# Changelog

All notable changes to the Progressly Enterprise Admin Dashboard will be documented in this file.

## [1.0.0] - 2026-07-11
### Added
- Centralized `AdminRefreshProvider` refresh event system with configurable refresh groups.
- Backend-driven analytical report export view supporting CSV (StreamingHttpResponse) and JSON downloads.
- Reusable `AdminMobileCard` presentation-only component for layout consistency on mobile screen widths.
- Advanced security filters, IP search, OS client categorization, and date-range constraints on Login History.
- Versioned structured preferences JSON schema containing Dashboard, Reports, and Application settings.
- Real-time diagnostic groupings on System Health dashboard matching critical and optional services.
- Superuser role deactivation and demotion protections on backend and frontend admin listings.
- central database query optimization filters including select_related/prefetch_related on foreign fields.

### Fixed
- Fixed backend 500 error on `/api/admin/system-health` endpoint.
- Fixed SMTP email logs and Cloudinary connections verification check.
- Fixed database locks and duplicate API requests during dashboard rendering.
