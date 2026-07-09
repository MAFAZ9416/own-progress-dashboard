from django.db import models
from django.conf import settings
from django.utils import timezone


class EmailLog(models.Model):
    """Tracks every platform email dispatched (welcome, reset, notification, feedback reply)."""
    EMAIL_TYPE_CHOICES = (
        ('welcome', 'Welcome Email'),
        ('password_reset', 'Password Reset'),
        ('admin_password_reset', 'Admin Password Reset'),
        ('feedback_reply', 'Feedback Reply'),
        ('admin_notification', 'Admin Notification'),
        ('system', 'System'),
    )
    STATUS_CHOICES = (
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    )
    recipient_email = models.EmailField()
    subject = models.CharField(max_length=255)
    email_type = models.CharField(max_length=30, choices=EMAIL_TYPE_CHOICES, default='system')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='sent')
    sent_at = models.DateTimeField(default=timezone.now)
    error_message = models.TextField(blank=True, null=True)
    # Optional FK to user if known
    related_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='email_logs'
    )
    # Which admin triggered it (null = system-triggered)
    created_by = models.CharField(max_length=150, blank=True, default='system')

    class Meta:
        ordering = ['-sent_at']

    def __str__(self):
        return f"[{self.status.upper()}] {self.email_type} → {self.recipient_email}"


class BackupLog(models.Model):
    """Tracks all admin-generated data backup records."""
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=512, blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='backup_logs'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    size_bytes = models.BigIntegerField(default=0)
    note = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.file_name} ({self.created_at.strftime('%Y-%m-%d')})"


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
