from django.urls import path
from .views import DashboardSummaryView,WeeklyAnalyticsView,MonthlyAnalyticsView,RecentActivityView,HeatmapAnalyticsView


urlpatterns = [
    path('summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('weekly/', WeeklyAnalyticsView.as_view(), name='weekly-analytics'),
    path('monthly/', MonthlyAnalyticsView.as_view(), name='monthly-analytics'),
    path('recent/', RecentActivityView.as_view(), name='recent-activity'),
    path('heatmap/', HeatmapAnalyticsView.as_view(), name='heatmap-analytics'),
]
