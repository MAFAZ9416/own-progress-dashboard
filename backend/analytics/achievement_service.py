from notifications.notification_service import create_notification

from .activity_service import log_activity
from .models import Achievement, UserAchievement


DEFAULT_ACHIEVEMENTS = [
    {
        'name': 'First Step',
        'description': 'Create your first skill.',
        'icon': '🥇',
        'condition': 'skills_created >= 1',
    },
    {
        'name': 'Consistent Learner',
        'description': 'Maintain a 7 day streak.',
        'icon': '🔥',
        'condition': 'current_streak >= 7',
    },
    {
        'name': 'Productive',
        'description': 'Complete 50 tasks.',
        'icon': '⚡',
        'condition': 'completed_tasks >= 50',
    },
    {
        'name': 'Master',
        'description': 'Complete a skill to 100%.',
        'icon': '👑',
        'condition': 'skill_progress >= 100',
    },
    {
        'name': 'Champion',
        'description': 'Complete 100 tasks.',
        'icon': '🏆',
        'condition': 'completed_tasks >= 100',
    },
]


def seed_default_achievements():
    achievements = []
    for payload in DEFAULT_ACHIEVEMENTS:
        achievement, _ = Achievement.objects.get_or_create(name=payload['name'], defaults=payload)
        achievements.append(achievement)
    return achievements


def unlock_achievement(user, achievement, metadata=None):
    if user is None or achievement is None:
        return None

    unlocked, created = UserAchievement.objects.get_or_create(user=user, achievement=achievement)
    if not created:
        return unlocked

    payload = metadata or {'achievement_id': achievement.id, 'achievement_name': achievement.name}
    create_notification(
        user,
        f"{achievement.icon} {achievement.name}",
        achievement.description,
        'achievement',
        metadata=payload,
    )
    log_activity(user, 'achievement_unlocked', f"Unlocked {achievement.name}", metadata=payload)
    return unlocked


def check_achievements_for_user(user, *, skill=None, task=None, streak=None):
    """
    Check ALL achievement conditions independently for the given user.

    Each condition is evaluated regardless of which trigger (skill/task/streak)
    called this function. This ensures that:
    - Completing achievement #4 condition does NOT require achieving #1, #2, #3 first.
    - Every call checks every condition — no order dependency.
    - Duplicate unlocks are prevented by get_or_create inside unlock_achievement().
    """
    from skills.models import Skill
    from streaks.models import Streak
    from tasks.models import Task

    achievements = {item.name: item for item in seed_default_achievements()}

    # ── Condition 1: Create first skill ─────────────────────────────────────
    if Skill.objects.filter(user=user).count() >= 1:
        unlock_achievement(user, achievements['First Step'], {'source': 'skill_created'})

    # ── Condition 2: Complete 50 tasks ──────────────────────────────────────
    completed_tasks_count = Task.objects.filter(user=user, status='completed').count()
    if completed_tasks_count >= 50:
        unlock_achievement(user, achievements['Productive'], {'completed_tasks': completed_tasks_count})

    # ── Condition 3: Complete 100 tasks ─────────────────────────────────────
    if completed_tasks_count >= 100:
        unlock_achievement(user, achievements['Champion'], {'completed_tasks': completed_tasks_count})

    # ── Condition 4: Maintain 7-day streak ──────────────────────────────────
    streak_obj = streak or Streak.objects.filter(user=user).first()
    if streak_obj and streak_obj.current_streak >= 7:
        unlock_achievement(
            user,
            achievements['Consistent Learner'],
            {'current_streak': streak_obj.current_streak},
        )

    # ── Condition 5: Complete a skill to 100% ───────────────────────────────
    # Check via the passed-in skill first (fast path), then full scan if not provided
    if skill is not None:
        completed = skill.tasks.filter(status='completed').count()
        progress = min(int((completed / skill.target_tasks) * 100), 100) if skill.target_tasks else 0
        if progress >= 100:
            unlock_achievement(
                user,
                achievements['Master'],
                {'skill_id': skill.id, 'skill_name': skill.name, 'progress': progress},
            )
    else:
        # Full scan for any mastered skill (e.g. called from task completion trigger)
        for s in Skill.objects.filter(user=user, target_tasks__gt=0):
            done = s.tasks.filter(status='completed').count()
            if done >= s.target_tasks:
                unlock_achievement(
                    user,
                    achievements['Master'],
                    {'skill_name': s.name, 'progress': 100},
                )
                break  # One master achievement unlock is enough for this trigger
