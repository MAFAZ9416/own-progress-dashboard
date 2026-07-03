import logging
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.contrib.auth.signals import user_logged_in
from django.utils import timezone
from skills.models import Skill
from tasks.models import Task, TaskCompletion
from .models import AdminActivityLog, AdminNotification, UserLifecycleEvent

User = get_user_model()
logger = logging.getLogger(__name__)

@receiver(post_save, sender=User)
def user_post_save(sender, instance, created, **kwargs):
    try:
        if created:
            AdminActivityLog.objects.create(
                username=instance.username,
                action=f"User created: {instance.username}"
            )
            # Record user lifecycle creation
            UserLifecycleEvent.objects.create(
                event_type='create',
                username=instance.username,
                timestamp=instance.date_joined or timezone.now()
            )
            AdminNotification.objects.create(
                title="New User Registered",
                message=f"User {instance.username} completed registration.",
                level="info"
            )
        else:
            # Check if is_active is modified (disabled / activated)
            AdminActivityLog.objects.create(
                username="system",
                action=f"User updated: {instance.username}"
            )
    except Exception as e:
        logger.error(f"Error in user_post_save signal: {e}")

@receiver(pre_delete, sender=User)
def user_pre_delete(sender, instance, **kwargs):
    try:
        AdminActivityLog.objects.create(
            username="system",
            action=f"User deleted: {instance.username}"
        )
        # Record user lifecycle deletion
        UserLifecycleEvent.objects.create(
            event_type='delete',
            username=instance.username,
            timestamp=timezone.now()
        )
        AdminNotification.objects.create(
            title="User Deleted",
            message=f"User {instance.username} profile has been removed from system.",
            level="warning"
        )
    except Exception as e:
        logger.error(f"Error in user_pre_delete signal: {e}")

@receiver(post_save, sender=Skill)
def skill_post_save(sender, instance, created, **kwargs):
    try:
        if created:
            AdminActivityLog.objects.create(
                username=instance.user.username,
                action=f"Skill created: {instance.name}"
            )
        else:
            AdminActivityLog.objects.create(
                username=instance.user.username,
                action=f"Skill updated: {instance.name}"
            )
    except Exception as e:
        logger.error(f"Error in skill_post_save signal: {e}")

@receiver(pre_delete, sender=Skill)
def skill_pre_delete(sender, instance, **kwargs):
    try:
        AdminActivityLog.objects.create(
            username=instance.user.username,
            action=f"Skill deleted: {instance.name}"
        )
    except Exception as e:
        logger.error(f"Error in skill_pre_delete signal: {e}")

@receiver(post_save, sender=Task)
def task_post_save(sender, instance, created, **kwargs):
    try:
        if created:
            AdminActivityLog.objects.create(
                username=instance.user.username,
                action=f"Task created: {instance.title}"
            )
        else:
            if instance.status == 'completed':
                # Prevent duplicate logs for the same completion status
                exists = AdminActivityLog.objects.filter(
                    username=instance.user.username,
                    action=f"Task completed: {instance.title}"
                ).exists()
                if not exists:
                    AdminActivityLog.objects.create(
                        username=instance.user.username,
                        action=f"Task completed: {instance.title}"
                    )
            else:
                AdminActivityLog.objects.create(
                    username=instance.user.username,
                    action=f"Task updated: {instance.title}"
                )
    except Exception as e:
        logger.error(f"Error in task_post_save signal: {e}")

@receiver(pre_delete, sender=Task)
def task_pre_delete(sender, instance, **kwargs):
    try:
        AdminActivityLog.objects.create(
            username=instance.user.username,
            action=f"Task removed: {instance.title}"
        )
    except Exception as e:
        logger.error(f"Error in task_pre_delete signal: {e}")

@receiver(user_logged_in)
def user_logged_in_handler(sender, request, user, **kwargs):
    try:
        AdminActivityLog.objects.create(
            username=user.username,
            action=f"User logged in: {user.username}"
        )
    except Exception as e:
        logger.error(f"Error in user_logged_in_handler signal: {e}")
