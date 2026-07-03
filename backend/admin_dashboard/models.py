from django.db import models
from django.conf import settings

class AdminFeedback(models.Model):
    name = models.CharField(max_length=100)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    rating = models.PositiveIntegerField(default=5)  # 1 to 5 stars
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Feedback from {self.name} - {self.rating} Stars"


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
