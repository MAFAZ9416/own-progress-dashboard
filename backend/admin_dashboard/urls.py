from django.urls import path
from .views import (
    AdminDashboardSummaryView,
    AdminQuickActionView,
    AdminUserGrowthChartView,
    AdminTaskCompletionChartView,
    AdminActivityChartView
)

urlpatterns = [
    path('dashboard/', AdminDashboardSummaryView.as_view(), name='admin-dashboard-summary'),
    path('dashboard/charts/user-growth/', AdminUserGrowthChartView.as_view(), name='admin-user-growth-chart'),
    path('dashboard/charts/tasks/', AdminTaskCompletionChartView.as_view(), name='admin-task-completion-chart'),
    path('dashboard/charts/activity/', AdminActivityChartView.as_view(), name='admin-activity-chart'),
    path('action/', AdminQuickActionView.as_view(), name='admin-quick-action'),
]
