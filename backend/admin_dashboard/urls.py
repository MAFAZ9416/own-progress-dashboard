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
    AdminSkillCreateView
)

urlpatterns = [
    path('dashboard/', AdminDashboardSummaryView.as_view(), name='admin-dashboard-summary'),
    path('dashboard/charts/user-growth/', AdminUserGrowthChartView.as_view(), name='admin-user-growth-chart'),
    path('dashboard/charts/tasks/', AdminTaskCompletionChartView.as_view(), name='admin-task-completion-chart'),
    path('dashboard/charts/activity/', AdminActivityChartView.as_view(), name='admin-activity-chart'),
    path('action/', AdminQuickActionView.as_view(), name='admin-quick-action'),
    path('users/', AdminUsersListView.as_view(), name='admin-users-list'),
    path('users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('skills/<int:pk>/', AdminSkillDetailView.as_view(), name='admin-skill-detail'),
    path('tasks/<int:pk>/', AdminTaskDetailView.as_view(), name='admin-task-detail'),
    
    # Skills Management Routes
    path('skills/list/', AdminSkillListView.as_view(), name='admin-skills-list-summary'),
    path('skills/group-detail/', AdminSkillGroupDetailView.as_view(), name='admin-skills-group-detail'),
    path('skills/global-edit/', AdminSkillGlobalEditView.as_view(), name='admin-skills-global-edit'),
    path('skills/global-delete/', AdminSkillGlobalDeleteView.as_view(), name='admin-skills-global-delete'),
    path('skills/create/', AdminSkillCreateView.as_view(), name='admin-skills-create'),
]
