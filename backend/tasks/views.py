from datetime import timedelta

from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Task, TaskCompletion
from .serializers import TaskCompletionSerializer, TaskSerializer
from streaks.models import Streak


class TaskViewSet(viewsets.ModelViewSet):
    """Full CRUD for tasks, limited to the authenticated user's own records."""

    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        skill = serializer.validated_data.get("skill")
        if skill.user != self.request.user:
            raise ValidationError({"skill": "You may only assign tasks to your own skills."})
        serializer.save(user=self.request.user)


class CompleteTaskView(APIView):
    """Mark a task as completed and record its completion."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, task_id, *args, **kwargs):
        task = get_object_or_404(Task, pk=task_id, user=request.user)

        if task.status == "completed":
            raise ValidationError({"detail": "Task is already completed."})

        task.status = "completed"
        task.save(update_fields=["status"])

        completion = TaskCompletion.objects.create(
            task=task,
            user=request.user,
            skill=task.skill,
        )

        today = timezone.now().date()
        streak, _ = Streak.objects.get_or_create(user=request.user)

        if streak.last_active_date == today:
            pass
        elif streak.last_active_date == today - timedelta(days=1):
            streak.current_streak += 1
        else:
            streak.current_streak = 1

        if streak.current_streak > streak.longest_streak:
            streak.longest_streak = streak.current_streak

        streak.last_active_date = today
        streak.save(update_fields=["current_streak", "longest_streak", "last_active_date"])

        serializer = TaskCompletionSerializer(completion)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReopenTaskView(APIView):
    """Reopen a completed task by setting it back to pending."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, task_id, *args, **kwargs):
        task = get_object_or_404(Task, pk=task_id, user=request.user)

        task.status = "pending"
        task.save(update_fields=["status"])
        return Response({"detail": "Task reopened successfully."}, status=status.HTTP_200_OK)


class TaskHistoryView(APIView):
    """Return completion history for a specific task."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, task_id, *args, **kwargs):
        task = get_object_or_404(Task, pk=task_id, user=request.user)
        completions = TaskCompletion.objects.filter(task=task).order_by("-completed_at")
        serializer = TaskCompletionSerializer(completions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
