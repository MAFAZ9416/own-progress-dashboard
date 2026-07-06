from django.db.models import Count, Q
from rest_framework import permissions, viewsets

from .models import Skill
from .serializers import SkillSerializer
from notifications.notification_service import create_notification


class SkillViewSet(viewsets.ModelViewSet):
    """Full CRUD for skills, limited to the authenticated user's own records."""

    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Skill.objects.filter(user=self.request.user)
            .annotate(
                completed_tasks_count=Count(
                    'tasks', filter=Q(tasks__status='completed')
                )
            )
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        skill = serializer.save(user=self.request.user)
        create_notification(
            self.request.user,
            "New Skill Added",
            f"You started learning {skill.name} 🚀",
            "info",
            metadata={
                'skill_id': skill.id,
                'skill_name': skill.name,
                'progress': 0,
                'completed_tasks': 0,
                'total_tasks': skill.target_tasks,
            },
        )
