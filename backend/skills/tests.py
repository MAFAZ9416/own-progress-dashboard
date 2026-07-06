from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from notifications.models import Notification

User = get_user_model()


class SkillNotificationTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(username='skilluser', email='skill@example.com', password='password123')
		self.client.force_authenticate(user=self.user)

	def test_skill_creation_creates_notification(self):
		response = self.client.post(
			reverse('skill-list'),
			{
				'name': 'Python',
				'color': '#3B82F6',
				'target_tasks': 4,
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(
			Notification.objects.filter(
				user=self.user,
				title='New Skill Added',
				notification_type='info',
			).exists()
		)

