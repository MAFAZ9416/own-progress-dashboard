from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminDashboardStatsView, DatabaseMonitorView, SystemHealthView,
    UserManagementViewSet, SkillsManagementViewSet, TaskManagementViewSet,
    FeedbackViewSet, EmailLogViewSet, AdminNotificationViewSet,
    BackupViewSet, SystemSettingsView, AdminReportsView,
    ActivityLogViewSet, GroupViewSet, PermissionViewSet
)

router = DefaultRouter()
router.register(r'users', UserManagementViewSet, basename='admin-users')
router.register(r'skills', SkillsManagementViewSet, basename='admin-skills')
router.register(r'tasks', TaskManagementViewSet, basename='admin-tasks')
router.register(r'feedback', FeedbackViewSet, basename='admin-feedback')
router.register(r'emails', EmailLogViewSet, basename='admin-emails')
router.register(r'notifications', AdminNotificationViewSet, basename='admin-notifications')
router.register(r'backups', BackupViewSet, basename='admin-backups')
router.register(r'activity-logs', ActivityLogViewSet, basename='admin-activity-logs')
router.register(r'roles', GroupViewSet, basename='admin-roles')
router.register(r'permissions', PermissionViewSet, basename='admin-permissions')

urlpatterns = [
    path('stats/', AdminDashboardStatsView.as_view(), name='admin-stats'),
    path('db-monitor/', DatabaseMonitorView.as_view(), name='admin-db-monitor'),
    path('system-health/', SystemHealthView.as_view(), name='admin-system-health'),
    path('settings/', SystemSettingsView.as_view(), name='admin-settings'),
    path('reports/', AdminReportsView.as_view(), name='admin-reports'),
    path('', include(router.urls)),
]
