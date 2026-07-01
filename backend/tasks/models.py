from django.db import models
from django.conf import settings
from skills.models import Skill


class Task(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks'
    )

    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        related_name='tasks'
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return self.title
    
    
class TaskCompletion(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='completions'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE
    )

    completed_at = models.DateTimeField(auto_now_add=True)
    completed_date = models.DateField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'completed_date']),
            models.Index(fields=['user', '-completed_at']),
        ]

    def __str__(self):
        return f"{self.task.title} completed"


class TaskActivity(models.Model):
    ACTION_CHOICES = (
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('completed', 'Completed'),
        ('reopened', 'Reopened'),
        ('deleted', 'Deleted'),
        ('restored', 'Restored'),
    )

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='activities'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.task.title} - {self.action}"
