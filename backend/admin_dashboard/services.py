import os
import json
import csv
import io
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.conf import settings
from .models import AdminFeedback, AdminNotification, AdminActivityLog, BackupLog

User = get_user_model()


def create_full_backup(created_by_user=None, admin_username='system'):
    """
    Creates a safe JSON backup of all production data.
    Excludes: passwords, tokens, sessions, email hashes, secret keys.
    Returns (backup_log, file_content_json_str).
    """
    from skills.models import Skill
    from tasks.models import Task
    from analytics.models import Achievement, UserAchievement, Activity
    from .models import AdminFeedback, AdminNotification, AdminActivityLog

    now = timezone.now()
    timestamp = now.strftime('%Y%m%d_%H%M%S')
    filename = f"progressly_backup_{timestamp}.json"

    # Serialize safe user data (no password hash)
    users_data = []
    for u in User.objects.select_related('profile').all():
        profile = getattr(u, 'profile', None)
        users_data.append({
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'is_active': u.is_active,
            'is_staff': u.is_staff,
            'is_superuser': u.is_superuser,
            'date_joined': u.date_joined.isoformat(),
            'last_login': u.last_login.isoformat() if u.last_login else None,
            'full_name': profile.full_name if profile else '',
            'country': profile.country if profile else '',
            'bio': profile.bio if profile else '',
        })

    skills_data = list(Skill.objects.values(
        'id', 'user_id', 'name', 'color', 'target_tasks', 'created_at'
    ))
    for s in skills_data:
        if s.get('created_at'):
            s['created_at'] = s['created_at'].isoformat()

    tasks_data = list(Task.objects.values(
        'id', 'user_id', 'skill_id', 'title', 'description',
        'status', 'priority', 'created_at', 'updated_at'
    ))
    for t in tasks_data:
        for k in ['created_at', 'updated_at']:
            if t.get(k):
                t[k] = t[k].isoformat()

    achievements_data = list(Achievement.objects.values(
        'id', 'name', 'description', 'icon', 'condition', 'is_active', 'created_at'
    ))
    for a in achievements_data:
        if a.get('created_at'):
            a['created_at'] = a['created_at'].isoformat()

    user_achievements_data = list(UserAchievement.objects.values(
        'id', 'user_id', 'achievement_id', 'unlocked_at'
    ))
    for ua in user_achievements_data:
        if ua.get('unlocked_at'):
            ua['unlocked_at'] = ua['unlocked_at'].isoformat()

    feedback_data = list(AdminFeedback.objects.values(
        'id', 'name', 'email', 'subject', 'rating', 'comment', 'status', 'created_at'
    ))
    for f in feedback_data:
        if f.get('created_at'):
            f['created_at'] = f['created_at'].isoformat()

    payload = {
        'backup_meta': {
            'created_at': now.isoformat(),
            'created_by': admin_username,
            'version': '1.0',
            'note': 'Progressly safe data backup. No passwords or tokens included.',
        },
        'users': users_data,
        'skills': skills_data,
        'tasks': tasks_data,
        'achievements': achievements_data,
        'user_achievements': user_achievements_data,
        'feedback': feedback_data,
        'totals': {
            'users': len(users_data),
            'skills': len(skills_data),
            'tasks': len(tasks_data),
            'achievements': len(achievements_data),
            'feedback': len(feedback_data),
        }
    }

    json_str = json.dumps(payload, indent=2, ensure_ascii=False)

    # Write to static/backups
    backup_dir = os.path.join(settings.BASE_DIR, 'static', 'backups')
    os.makedirs(backup_dir, exist_ok=True)
    filepath = os.path.join(backup_dir, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(json_str)

    size_bytes = os.path.getsize(filepath)

    # Create BackupLog
    backup_log = BackupLog.objects.create(
        file_name=filename,
        file_path=filepath,
        created_by=created_by_user,
        size_bytes=size_bytes,
        note=f"Full safe backup by {admin_username}"
    )

    AdminActivityLog.objects.create(
        username=admin_username,
        action=f"Database backup '{filename}' created ({round(size_bytes/1024, 1)} kB)"
    )
    AdminNotification.objects.create(
        title="Database Backup Completed",
        message=f"Backup '{filename}' created by {admin_username}. Size: {round(size_bytes/1024, 1)} kB.",
        level="success"
    )

    return backup_log, json_str


def trigger_quick_action(action_type, username, user_obj=None):
    """
    Executes administrative quick actions, returning status and logging events.
    """
    now = timezone.now()

    if action_type == 'backup':
        try:
            backup_log, _ = create_full_backup(
                created_by_user=user_obj,
                admin_username=username
            )
            return {
                'status': 'success',
                'message': f"Backup '{backup_log.file_name}' created successfully.",
                'backup_id': backup_log.id,
                'file_name': backup_log.file_name,
                'size_bytes': backup_log.size_bytes,
            }
        except Exception as e:
            return {'status': 'error', 'message': f"Backup failed: {str(e)}"}

    elif action_type == 'report':
        # Build real platform summary report
        from skills.models import Skill
        from tasks.models import Task
        from analytics.models import Achievement

        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        total_tasks = Task.objects.count()
        completed_tasks = Task.objects.filter(status='completed').count()
        total_skills = Skill.objects.count()
        total_achievements = Achievement.objects.count()
        feedback_count = AdminFeedback.objects.count()

        report_dir = os.path.join(settings.BASE_DIR, 'static', 'reports')
        os.makedirs(report_dir, exist_ok=True)
        filename = f"progressly_report_{now.strftime('%Y%m%d_%H%M%S')}.csv"
        filepath = os.path.join(report_dir, filename)

        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['Progressly Platform Report', now.strftime('%Y-%m-%d %H:%M:%S')])
            writer.writerow([])
            writer.writerow(['Metric', 'Value'])
            writer.writerow(['Total Users', total_users])
            writer.writerow(['Active Users', active_users])
            writer.writerow(['Total Tasks', total_tasks])
            writer.writerow(['Completed Tasks', completed_tasks])
            writer.writerow(['Task Completion Rate', f"{round(completed_tasks/total_tasks*100, 1) if total_tasks else 0}%"])
            writer.writerow(['Total Skills', total_skills])
            writer.writerow(['Total Achievements', total_achievements])
            writer.writerow(['Total Feedback Entries', feedback_count])
            writer.writerow([])
            writer.writerow(['Generated by', username])

        AdminActivityLog.objects.create(
            username=username,
            action=f"System analytical report generated: {filename}"
        )
        AdminNotification.objects.create(
            title="System Report Generated",
            message=f"Report '{filename}' compiled by {username}.",
            level="info"
        )
        return {
            'status': 'success',
            'message': f"Report generated: {filename}",
            'file_name': filename,
        }

    elif action_type == 'announcement':
        from notifications.notification_service import broadcast_notification
        AdminActivityLog.objects.create(
            username=username,
            action="System-wide announcement broadcast sent."
        )
        AdminNotification.objects.create(
            title="Broadcast Announcement",
            message=f"Maintenance/announcement sent to all active users by {username}.",
            level="warning"
        )
        # Background broadcast
        from threading import Thread
        def _broadcast():
            try:
                broadcast_notification(
                    title="Progressly Announcement",
                    message=f"An important announcement has been posted by {username}.",
                    type="system",
                    metadata={'source': 'admin_announcement', 'author': username},
                )
            except Exception:
                pass
        Thread(target=_broadcast, daemon=True).start()
        return {'status': 'success', 'message': "Announcement broadcasted to all users."}

    else:
        return {'status': 'error', 'message': f"Unknown action type: {action_type}"}


def seed_initial_data():
    """Seeding is disabled. All data is 100% database-driven."""
    pass
