from django.contrib.auth import get_user_model

from .models import Notification

User = get_user_model()


def _notifications_allowed(user):
    profile = getattr(user, 'profile', None)
    return getattr(profile, 'notifications_enabled', True)


def create_notification(user, title, message, type='system', metadata=None):
    if user is None:
        return None

    if not getattr(user, 'pk', None):
        user = User.objects.get(pk=user)

    if not _notifications_allowed(user):
        return None

    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=type,
        metadata=metadata or {},
    )


def broadcast_notification(title, message, type='system', metadata=None):
    notifications = []
    users = User.objects.select_related('profile').all()

    for user in users:
        if not _notifications_allowed(user):
            continue

        notifications.append(
            Notification(
                user_id=user.id,
                title=title,
                message=message,
                notification_type=type,
                metadata=metadata or {},
            )
        )

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
    metadata = {
        'skill_id': skill.id,
        'skill_name': skill.name,
        'progress': progress,
        'completed_tasks': completed_tasks,
        'total_tasks': skill.target_tasks,
        'milestone': milestone,
    }

    if Notification.objects.filter(
        user=user,
        title=title,
        notification_type='achievement',
    ).exists():
        return None

    return create_notification(user, title, message, 'achievement', metadata=metadata)


def create_streak_notification(user, streak):
    if streak.current_streak and streak.current_streak % 7 == 0:
        title = f"🔥 {streak.current_streak} Day Streak Achieved"
        message = f"You have kept your learning streak going for {streak.current_streak} days."
        metadata = {
            'current_streak': streak.current_streak,
            'longest_streak': streak.longest_streak,
            'last_activity_date': str(streak.last_activity_date) if streak.last_activity_date else None,
        }
        return create_notification(user, title, message, 'achievement', metadata=metadata)
    return None
