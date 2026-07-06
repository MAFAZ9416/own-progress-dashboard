from django.contrib.auth import get_user_model

from .models import Notification

User = get_user_model()


def create_notification(user, title, message, type='system'):
    if user is None:
        return None

    if not getattr(user, 'pk', None):
        user = User.objects.get(pk=user)

    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=type,
    )


def broadcast_notification(title, message, type='system'):
    notifications = [
        Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=type,
        )
        for user_id in User.objects.values_list('id', flat=True)
    ]

    if notifications:
        Notification.objects.bulk_create(notifications, batch_size=500)

    return len(notifications)


def create_skill_milestone_notification(user, skill):
    from tasks.models import Task

    if not skill.target_tasks:
        return None

    completed_tasks = Task.objects.filter(
        user=user,
        skill=skill,
        status='completed',
    ).count()
    progress = min(int((completed_tasks / skill.target_tasks) * 100), 100)
    milestone = None
    for threshold in (25, 50, 75, 100):
        if progress >= threshold:
            milestone = threshold

    if milestone is None:
        return None

    title = f"{skill.name} reached {milestone}% mastery 🏆"
    message = f"You have reached {milestone}% progress in {skill.name}."

    if Notification.objects.filter(
        user=user,
        title=title,
        notification_type='achievement',
    ).exists():
        return None

    return create_notification(user, title, message, 'achievement')
