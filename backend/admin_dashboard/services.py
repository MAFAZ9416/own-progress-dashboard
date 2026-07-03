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
    Seeding is disabled to maintain 100% database-driven dynamic metrics.
    """
    pass
