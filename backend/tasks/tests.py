from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from skills.models import Skill
from notifications.models import Notification
from .models import Task, TaskActivity

User = get_user_model()

class TaskActivityTests(APITestCase):
    """E2E/Unit test cases verifying task actions logging activity audit trail."""

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="testpassword123")
        self.client.force_authenticate(user=self.user)
        self.skill = Skill.objects.create(user=self.user, name="Python Programming", target_tasks=1)

    def test_task_activity_lifecycle(self):
        # 1. Test Task Creation Activity Log
        url = reverse("task-list")
        data = {
            "title": "Learn Django Rest Framework",
            "description": "Understand model serializers and views",
            "skill": self.skill.id,
            "status": "pending"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        task_id = response.data["id"]

        self.assertTrue(TaskActivity.objects.filter(task_id=task_id, action="created").exists())

        # 2. Test Task Update Activity Log
        url_detail = reverse("task-detail", args=[task_id])
        response = self.client.patch(url_detail, {"title": "Learn DRF Serialization"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertTrue(TaskActivity.objects.filter(task_id=task_id, action="updated").exists())

        # 3. Test Task Completion Activity Log
        url_complete = reverse("task-complete", args=[task_id])
        response = self.client.post(url_complete)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertTrue(TaskActivity.objects.filter(task_id=task_id, action="completed").exists())
        self.assertTrue(
            Notification.objects.filter(
                user=self.user,
                title="Task Completed",
                notification_type="success",
            ).exists()
        )
        self.assertTrue(
            Notification.objects.filter(
                user=self.user,
                title="Python Programming reached 100% mastery 🏆",
                notification_type="achievement",
            ).exists()
        )

        # 4. Test Task Reopen Activity Log
        url_reopen = reverse("task-reopen", args=[task_id])
        response = self.client.post(url_reopen)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertTrue(TaskActivity.objects.filter(task_id=task_id, action="reopened").exists())

        # 5. Test Listing Task Activities (Timeline)
        url_activity = reverse("task-activity", args=[task_id])
        response = self.client.get(url_activity)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Expected activities: reopened, completed, updated, created (ordered descending)
        self.assertEqual(len(response.data), 4)
        self.assertEqual(response.data[0]["action"], "reopened")
        self.assertEqual(response.data[1]["action"], "completed")
        self.assertEqual(response.data[2]["action"], "updated")
        self.assertEqual(response.data[3]["action"], "created")

        # 6. Test Task Deletion Activity Log
        response = self.client.delete(url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Cascades task deletion, removing activities from database
        self.assertEqual(TaskActivity.objects.filter(task_id=task_id).count(), 0)
