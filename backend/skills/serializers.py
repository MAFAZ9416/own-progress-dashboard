from rest_framework import serializers

from .models import Skill


class SkillSerializer(serializers.ModelSerializer):
    """Serialize Skill records with computed progress."""

    progress = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Skill
        fields = [
            "id",
            "name",
            "color",
            "target_tasks",
            "goal_description",
            "target_date",
            "level",
            "started_date",
            "progress",
            "created_at",
        ]
        read_only_fields = ["id", "progress", "created_at", "started_date"]

    def get_progress(self, obj):
        """Calculate progress from completed tasks for this skill."""
        completed_tasks = getattr(obj, 'completed_tasks_count', None)
        if completed_tasks is None:
            completed_tasks = obj.tasks.filter(status="completed").count()
        if not obj.target_tasks:
            return 0
        progress_percent = round((completed_tasks / obj.target_tasks) * 100, 2)
        return min(progress_percent, 100)
