import os
import sys
import django

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from admin_dashboard.models import AdminFeedback, AdminNotification, AdminActivityLog, UserLifecycleEvent

print("Clearing admin tables...")
f_count = AdminFeedback.objects.all().delete()[0]
n_count = AdminNotification.objects.all().delete()[0]
a_count = AdminActivityLog.objects.all().delete()[0]
l_count = UserLifecycleEvent.objects.all().delete()[0]

print(f"Deleted {f_count} feedbacks.")
print(f"Deleted {n_count} notifications.")
print(f"Deleted {a_count} activities.")
print(f"Deleted {l_count} user lifecycle events.")
print("Admin tables cleared successfully!")
