import os
import sys
import django

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from django.contrib.auth import get_user_model
from admin_dashboard.models import AdminFeedback, AdminNotification, AdminActivityLog, UserLifecycleEvent
from skills.models import Skill
from tasks.models import Task

User = get_user_model()

print("Neon Database Name:", connection.settings_dict['NAME'])

print("\nModel Counts:")
print("  Users:", User.objects.count())
print("  Skills:", Skill.objects.count())
print("  Tasks:", Task.objects.count())
print("  Feedback:", AdminFeedback.objects.count())
print("  Notifications:", AdminNotification.objects.count())
print("  Activity Logs:", AdminActivityLog.objects.count())
print("  Lifecycle Events:", UserLifecycleEvent.objects.count())

print("\nLast 5 Feedback entries:")
for f in AdminFeedback.objects.all()[:5]:
    print(f"  ID={f.id}, Name={f.name}, Comment={f.comment}")

print("\nLast 5 Notifications:")
for n in AdminNotification.objects.all()[:5]:
    print(f"  ID={n.id}, Title={n.title}, Message={n.message}")

print("\nLast 5 Activity Logs:")
for a in AdminActivityLog.objects.all()[:5]:
    print(f"  ID={a.id}, Username={a.username}, Action={a.action}")
