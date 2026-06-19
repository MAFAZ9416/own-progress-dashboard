from rest_framework import serializers

from .models import Task, TaskCompletion


class TaskSerializer(serializers.ModelSerializer):
    """Serialize Task objects for CRUD operations."""

    class Meta:
        model = Task
        fields = [
            "id",
            "skill",
            "title",
            "description",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_skill(self, value):
        request = self.context.get("request")
        if request and request.user != value.user:
            raise serializers.ValidationError("You may only assign tasks to your own skills.")
        return value


class TaskCompletionSerializer(serializers.ModelSerializer):
    """Serialize TaskCompletion objects for tracking task completions."""

    class Meta:
        model = TaskCompletion
        fields = [
            "id",
            "task",
            "skill",
            "completed_at",
            "completed_date",
        ]
        read_only_fields = ["id", "completed_at", "completed_date"]
