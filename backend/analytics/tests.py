from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from skills.models import Skill
from tasks.models import Task

User = get_user_model()

class DashboardSummaryTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="testpassword123")
        self.client.force_authenticate(user=self.user)
        self.skill = Skill.objects.create(user=self.user, name="Python Programming", target_tasks=10)

    def test_dashboard_summary_includes_tasks_done(self):
        # Create 2 completed and 2 pending tasks
        Task.objects.create(user=self.user, skill=self.skill, title="Task 1", status="completed")
        Task.objects.create(user=self.user, skill=self.skill, title="Task 2", status="completed")
        Task.objects.create(user=self.user, skill=self.skill, title="Task 3", status="pending")
        Task.objects.create(user=self.user, skill=self.skill, title="Task 4", status="pending")

        url = reverse("dashboard-summary")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertIn("tasks_done", response.data)
        self.assertEqual(response.data["tasks_done"], 2)
        self.assertEqual(response.data["total_tasks"], 4)
