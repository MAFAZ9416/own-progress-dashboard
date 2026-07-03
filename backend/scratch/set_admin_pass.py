import os
import sys
import django

# Add backend root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

try:
    admin = User.objects.get(username='progressly_admin')
    admin.set_password('adminpass')
    admin.save()
    print("Successfully set password for progressly_admin to 'adminpass'")
except User.DoesNotExist:
    print("progressly_admin does not exist!")
