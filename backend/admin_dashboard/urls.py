from django.urls import path
from .views import AdminDashboardSummaryView, AdminQuickActionView

urlpatterns = [
    path('dashboard/', AdminDashboardSummaryView.as_view(), name='admin-dashboard-summary'),
    path('action/', AdminQuickActionView.as_view(), name='admin-quick-action'),
]
