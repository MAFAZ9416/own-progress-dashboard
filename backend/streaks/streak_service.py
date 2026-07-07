from datetime import timedelta

from django.utils import timezone

from .models import Streak


def update_user_streak(user, activity_date=None):
    """Update the user's streak after a qualifying activity."""
    today = activity_date or timezone.now().date()
    streak, _ = Streak.objects.get_or_create(user=user)

    if streak.last_activity_date == today:
        return streak

    if streak.last_activity_date == today - timedelta(days=1):
        streak.current_streak += 1
    else:
        streak.current_streak = 1

    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    streak.last_activity_date = today
    streak.save(update_fields=["current_streak", "longest_streak", "last_activity_date", "updated_at"])
    return streak