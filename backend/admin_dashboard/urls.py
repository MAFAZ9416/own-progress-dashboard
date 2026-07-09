from django.urls import path
from .views import (
    AdminDashboardSummaryView,
    AdminQuickActionView,
    AdminUserGrowthChartView,
    AdminTaskCompletionChartView,
    AdminActivityChartView,
    AdminUsersListView,
    AdminUserDetailView,
    AdminSkillDetailView,
    AdminTaskDetailView,
    AdminSkillListView,
    AdminSkillGroupDetailView,
    AdminSkillGlobalEditView,
    AdminSkillGlobalDeleteView,
    AdminSkillCreateView,
    AdminUserCreateView,
    AdminUserPasswordChangeView,
    
    AdminTasksListView,
    AdminAchievementsListView,
    AdminAchievementDetailView,
    AdminNotificationsListView,
    AdminFeedbackListView,
    AdminFeedbackDetailView,
    AdminFeedbackReplyView,
    AdminActivityLogsView,
    AdminReportsAnalyticsView
)

urlpatterns = [
    path('dashboard/', AdminDashboardSummaryView.as_view(), name='admin-dashboard-summary'),
    path('dashboard/charts/user-growth/', AdminUserGrowthChartView.as_view(), name='admin-user-growth-chart'),
    path('dashboard/charts/tasks/', AdminTaskCompletionChartView.as_view(), name='admin-task-completion-chart'),
    path('dashboard/charts/activity/', AdminActivityChartView.as_view(), name='admin-activity-chart'),
    path('action/', AdminQuickActionView.as_view(), name='admin-quick-action'),
    path('users/', AdminUsersListView.as_view(), name='admin-users-list'),
    path('users/create/', AdminUserCreateView.as_view(), name='admin-users-create'),
    path('users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('users/<int:pk>/change-password/', AdminUserPasswordChangeView.as_view(), name='admin-user-change-password'),
    path('skills/<int:pk>/', AdminSkillDetailView.as_view(), name='admin-skill-detail'),
    path('tasks/<int:pk>/', AdminTaskDetailView.as_view(), name='admin-task-detail'),
    
    # Skills Management Routes
    path('skills/list/', AdminSkillListView.as_view(), name='admin-skills-list-summary'),
    path('skills/group-detail/', AdminSkillGroupDetailView.as_view(), name='admin-skills-group-detail'),
    path('skills/global-edit/', AdminSkillGlobalEditView.as_view(), name='admin-skills-global-edit'),
    path('skills/global-delete/', AdminSkillGlobalDeleteView.as_view(), name='admin-skills-global-delete'),
    path('skills/create/', AdminSkillCreateView.as_view(), name='admin-skills-create'),
    
    # New Admin Dashboards Management Routes
    path('tasks/', AdminTasksListView.as_view(), name='admin-tasks-list'),
    path('achievements/', AdminAchievementsListView.as_view(), name='admin-achievements-list'),
    path('achievements/<int:pk>/', AdminAchievementDetailView.as_view(), name='admin-achievement-detail'),
    path('notifications/', AdminNotificationsListView.as_view(), name='admin-notifications-list'),
    path('feedback/', AdminFeedbackListView.as_view(), name='admin-feedback-list'),
    path('feedback/<int:pk>/', AdminFeedbackDetailView.as_view(), name='admin-feedback-detail'),
    path('feedback/<int:pk>/reply/', AdminFeedbackReplyView.as_view(), name='admin-feedback-reply'),
    path('activity/', AdminActivityLogsView.as_view(), name='admin-activity-logs'),
    path('reports/', AdminReportsAnalyticsView.as_view(), name='admin-reports-analytics'),
]
