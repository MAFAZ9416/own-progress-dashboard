from datetime import timedelta

from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Task, TaskCompletion, TaskActivity
from .serializers import TaskCompletionSerializer, TaskSerializer, TaskActivitySerializer
from streaks.models import Streak
from streaks.services import update_user_streak


class TaskViewSet(viewsets.ModelViewSet):
    """Full CRUD for tasks, limited to the authenticated user's own records."""

    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Task.objects.filter(user=self.request.user)
            .select_related("skill")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        skill = serializer.validated_data.get("skill")
        if skill.user != self.request.user:
            raise ValidationError({"skill": "You may only assign tasks to your own skills."})
        task = serializer.save(user=self.request.user)
        TaskActivity.objects.create(task=task, user=self.request.user, action="created")

    def perform_update(self, serializer):
        old_instance = serializer.instance
        old_title = old_instance.title
        old_description = old_instance.description
        old_skill = old_instance.skill_id
        old_status = old_instance.status

        task = serializer.save()
        new_title = task.title
        new_description = task.description
        new_skill = task.skill_id
        new_status = task.status

        # Determine if content other than status changed
        content_changed = (old_title != new_title) or (old_description != new_description) or (old_skill != new_skill)

        # Log appropriate action
        if old_status != new_status:
            if new_status == 'completed':
                # Sync TaskCompletion to keep dashboard analytics consistent
                TaskCompletion.objects.get_or_create(
                    task=task,
                    user=self.request.user,
                    skill=task.skill
                )
                TaskActivity.objects.create(task=task, user=self.request.user, action="completed")

                # Update streak
                update_user_streak(self.request.user)
            elif new_status == 'pending':
                # Clean up TaskCompletion to keep dashboard analytics consistent
                TaskCompletion.objects.filter(task=task).delete()
                TaskActivity.objects.create(task=task, user=self.request.user, action="reopened")

            # If user changed status AND title/description/skill in the same edit
            if content_changed:
                TaskActivity.objects.create(task=task, user=self.request.user, action="updated")
        elif content_changed:
            TaskActivity.objects.create(task=task, user=self.request.user, action="updated")

    def perform_destroy(self, instance):
        TaskActivity.objects.create(task=instance, user=self.request.user, action="deleted")
        instance.delete()


class CompleteTaskView(APIView):
    """Mark a task as completed and record its completion."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, task_id, *args, **kwargs):
        task = get_object_or_404(
            Task.objects.select_related("skill"), pk=task_id, user=request.user
        )

        if task.status == "completed":
            raise ValidationError({"detail": "Task is already completed."})

        task.status = "completed"
        task.save(update_fields=["status"])

        TaskActivity.objects.create(task=task, user=request.user, action="completed")

        completion = TaskCompletion.objects.create(
            task=task,
            user=request.user,
            skill=task.skill,
        )

        update_user_streak(request.user)

        serializer = TaskCompletionSerializer(completion)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReopenTaskView(APIView):
    """Reopen a completed task by setting it back to pending."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, task_id, *args, **kwargs):
        task = get_object_or_404(
            Task.objects.select_related("skill"), pk=task_id, user=request.user
        )

        task.status = "pending"
        task.save(update_fields=["status"])

        TaskActivity.objects.create(task=task, user=request.user, action="reopened")

        return Response({"detail": "Task reopened successfully."}, status=status.HTTP_200_OK)


class TaskHistoryView(APIView):
    """Return completion history for a specific task."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, task_id, *args, **kwargs):
        task = get_object_or_404(
            Task.objects.select_related("skill"), pk=task_id, user=request.user
        )
        completions = TaskCompletion.objects.filter(task=task).order_by("-completed_at")
        serializer = TaskCompletionSerializer(completions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TaskActivityView(APIView):
    """Return audit log activity for a specific task."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, task_id, *args, **kwargs):
        task = get_object_or_404(
            Task.objects.select_related("skill"), pk=task_id, user=request.user
        )
        activities = TaskActivity.objects.filter(task=task)
        serializer = TaskActivitySerializer(activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

