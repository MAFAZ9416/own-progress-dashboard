from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CompleteTaskView, ReopenTaskView, TaskHistoryView, TaskViewSet, TaskActivityView

router = DefaultRouter()
router.register(r"", TaskViewSet, basename="task")

urlpatterns = router.urls + [
    path("<int:task_id>/complete/", CompleteTaskView.as_view(), name="task-complete"),
    path("<int:task_id>/reopen/", ReopenTaskView.as_view(), name="task-reopen"),
    path("<int:task_id>/history/", TaskHistoryView.as_view(), name="task-history"),
    path("<int:task_id>/activity/", TaskActivityView.as_view(), name="task-activity"),
]
