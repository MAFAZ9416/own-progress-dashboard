from django.db import models
from django.conf import settings
from django.utils import timezone

class AdminFeedback(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('resolved', 'Resolved'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, default='')
    subject = models.CharField(max_length=255, blank=True, default='General Feedback')
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    rating = models.PositiveIntegerField(default=5)  # 1 to 5 stars
    comment = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Feedback from {self.name or (self.user.username if self.user else 'Anonymous')} - {self.rating} Stars"


class AdminNotification(models.Model):
    LEVEL_CHOICES = (
        ('info', 'Info'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('danger', 'Danger'),
    )
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='info')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.level.upper()}] {self.title}"


class AdminActivityLog(models.Model):
    username = models.CharField(max_length=150)
    action = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.username} - {self.action} at {self.created_at}"


class UserLifecycleEvent(models.Model):
    EVENT_TYPES = (
        ('create', 'Create'),
        ('delete', 'Delete'),
    )
    event_type = models.CharField(max_length=10, choices=EVENT_TYPES)
    username = models.CharField(max_length=150)
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.event_type.upper()} - {self.username} at {self.timestamp}"
