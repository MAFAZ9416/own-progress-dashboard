from datetime import timedelta
from django.utils import timezone
from .models import Streak

def update_user_streak(user):
    """
    Calculates and updates user task completion streaks.
    Checks consecutive completions to increment current_streak,
    adjust longest_streak, and record last_active_date.
    """
    today = timezone.now().date()
    streak, _ = Streak.objects.get_or_create(user=user)

    if streak.last_active_date == today:
        pass
    elif streak.last_active_date == today - timedelta(days=1):
        streak.current_streak += 1
    else:
        streak.current_streak = 1

    if streak.current_streak > streak.longest_streak:
        streak.longest_streak = streak.current_streak

    streak.last_active_date = today
    streak.save(update_fields=["current_streak", "longest_streak", "last_active_date"])
    return streak
