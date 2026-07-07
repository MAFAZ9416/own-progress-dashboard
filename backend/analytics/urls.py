from django.urls import path
from .views import (
    DashboardSummaryView,
    WeeklyAnalyticsView,
    MonthlyAnalyticsView,
    RecentActivityView,
    HeatmapAnalyticsView,
    SearchView,
    ExportDataView,
    AchievementsView,
    ActivityFeedView,
)


urlpatterns = [
    path('summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('weekly/', WeeklyAnalyticsView.as_view(), name='weekly-analytics'),
    path('monthly/', MonthlyAnalyticsView.as_view(), name='monthly-analytics'),
    path('recent/', RecentActivityView.as_view(), name='recent-activity'),
    path('heatmap/', HeatmapAnalyticsView.as_view(), name='heatmap-analytics'),
    path('search/', SearchView.as_view(), name='dashboard-search'),
    path('export/', ExportDataView.as_view(), name='dashboard-export'),
    path('achievements/', AchievementsView.as_view(), name='achievements'),
    path('activity/', ActivityFeedView.as_view(), name='activity-feed'),
]
