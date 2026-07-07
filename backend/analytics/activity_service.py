from .models import Activity


def log_activity(user, action_type, message, metadata=None):
    if user is None:
        return None

    return Activity.objects.create(
        user=user,
        action_type=action_type,
        message=message,
        metadata=metadata or {},
    )