from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Notification
from .notification_service import create_notification

User = get_user_model()


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='notifyuser', email='notify@example.com', password='password123')
        self.other_user = User.objects.create_user(username='otheruser', email='other@example.com', password='password123')
        self.client.force_authenticate(user=self.user)

        self.first = create_notification(
            self.user,
            'First',
            'First message',
            'info',
            metadata={'skill_name': 'Python', 'progress': 80},
        )
        self.second = create_notification(self.user, 'Second', 'Second message', 'warning')
        create_notification(self.other_user, 'Other', 'Other message', 'info')

    def test_list_mark_read_mark_all_and_delete(self):
        list_url = reverse('notification-list')
        response = self.client.get(list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertIn('type', response.data[0])
        self.assertIn('metadata', response.data[0])
        self.assertTrue(
            any(item['metadata'].get('skill_name') == 'Python' for item in response.data)
        )

    def test_notifications_respect_user_preference(self):
        self.user.profile.notifications_enabled = False
        self.user.profile.save(update_fields=['notifications_enabled'])

        created = create_notification(self.user, 'Muted', 'Muted message', 'info')
        self.assertIsNone(created)
        self.assertFalse(Notification.objects.filter(user=self.user, title='Muted').exists())

        read_url = reverse('notification-mark-read', args=[self.first.id])
        response = self.client.post(read_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.first.refresh_from_db()
        self.assertTrue(self.first.is_read)

        read_all_url = reverse('notification-read-all')
        response = self.client.post(read_all_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Notification.objects.filter(user=self.user, is_read=False).count() == 0)

        delete_url = reverse('notification-delete', args=[self.second.id])
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Notification.objects.filter(id=self.second.id).exists())
