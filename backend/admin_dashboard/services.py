import os
import json
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.conf import settings
from .models import AdminFeedback, AdminNotification, AdminActivityLog

User = get_user_model()

def trigger_quick_action(action_type, username):
    """
    Executes administrative quick actions, returning status and logging events.
    """
    now = timezone.now()
    
    if action_type == 'backup':
        # Create a database backup file (simulation using serialized JSON metadata)
        backup_dir = os.path.join(settings.BASE_DIR, 'static', 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        
        filename = f"backup_{now.strftime('%Y%m%d_%H%M%S')}.json"
        filepath = os.path.join(backup_dir, filename)
        
        backup_metadata = {
            'timestamp': now.isoformat(),
            'backup_by': username,
            'status': 'success'
        }
        
        with open(filepath, 'w') as f:
            json.dump(backup_metadata, f)
            
        # Log activity and create system notification
        AdminActivityLog.objects.create(
            username=username,
            action=f"Database backup '{filename}' completed successfully."
        )
        AdminNotification.objects.create(
            title="Database Backup Completed",
            message=f"System database backup completed by {username}.",
            level="success"
        )
        return {'status': 'success', 'message': f"Database backup completed. File: {filename}"}
        
    elif action_type == 'report':
        # Simulate report generation
        AdminActivityLog.objects.create(
            username=username,
            action="System analytical report generated."
        )
        AdminNotification.objects.create(
            title="System Report Generated",
            message=f"Enterprise analytical report compiled and downloaded by {username}.",
            level="info"
        )
        return {'status': 'success', 'message': "System report generated and logged successfully."}
        
    elif action_type == 'announcement':
        # Broadcast announcement
        AdminActivityLog.objects.create(
            username=username,
            action="System-wide announcement sent."
        )
        AdminNotification.objects.create(
            title="Broadcast Announcement",
            message=f"Active alert: Maintenance schedule notice sent to all users by {username}.",
            level="warning"
        )
        return {'status': 'success', 'message': "Announcement broadcasted successfully."}
        
    else:
        return {'status': 'error', 'message': f"Unknown action type: {action_type}"}

def seed_initial_data():
    """
    Seeds initial admin logs, feedback logs, and alert alerts if tables are empty.
    """
    # 1. Seed Customer Feedback
    if AdminFeedback.objects.count() == 0:
        AdminFeedback.objects.create(
            name="Liam Anderson",
            rating=5,
            comment="Amazing platform! It has boosted our productivity.",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
            created_at=timezone.now() - timedelta(hours=2)
        )
        AdminFeedback.objects.create(
            name="Olivia Martinez",
            rating=5,
            comment="Great experience overall. Keep improving!",
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
            created_at=timezone.now() - timedelta(hours=5)
        )
        AdminFeedback.objects.create(
            name="Noah Thomas",
            rating=5,
            comment="Very useful and easy to use. Love the UI!",
            avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
            created_at=timezone.now() - timedelta(days=1)
        )

    # 2. Seed System Notifications
    if AdminNotification.objects.count() == 0:
        AdminNotification.objects.create(
            title="Server backup completed",
            message="Weekly automated system backup completed successfully.",
            level="success",
            created_at=timezone.now() - timedelta(minutes=2)
        )
        AdminNotification.objects.create(
            title="New user registered",
            message="User Sarah Johnson completed registration.",
            level="info",
            created_at=timezone.now() - timedelta(minutes=15)
        )
        AdminNotification.objects.create(
            title="High CPU usage detected",
            message="API Server CPU load spike exceeded 85% safety threshold.",
            level="warning",
            created_at=timezone.now() - timedelta(minutes=45)
        )
        AdminNotification.objects.create(
            title="New feedback received",
            message="User feedback logged on Dashboard performance.",
            level="info",
            created_at=timezone.now() - timedelta(hours=2)
        )
        AdminNotification.objects.create(
            title="Weekly report generated",
            message="System metrics report compiled successfully.",
            level="success",
            created_at=timezone.now() - timedelta(hours=3)
        )

    # 3. Seed Activity Logs
    if AdminActivityLog.objects.count() == 0:
        AdminActivityLog.objects.create(
            username="system",
            action="New user registered: Sarah Johnson",
            created_at=timezone.now() - timedelta(minutes=2)
        )
        AdminActivityLog.objects.create(
            username="system",
            action="Task completed: Build React Dashboard",
            created_at=timezone.now() - timedelta(minutes=15)
        )
        AdminActivityLog.objects.create(
            username="mafaz_admin",
            action="Skill updated: Advanced JavaScript",
            created_at=timezone.now() - timedelta(hours=1)
        )
        AdminActivityLog.objects.create(
            username="system",
            action="New feedback received: UI/UX is excellent!",
            created_at=timezone.now() - timedelta(hours=2)
        )
        AdminActivityLog.objects.create(
            username="mafaz_admin",
            action="User logged in: Michael Brown",
            created_at=timezone.now() - timedelta(hours=3)
        )
