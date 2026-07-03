import os
import sys
import django

# Add backend root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

admins = User.objects.filter(is_superuser=True) | User.objects.filter(is_staff=True)
print("Admin users count:", admins.count())
for a in admins:
    print(f"  Username: {a.username}, Email: {a.email}, is_superuser: {a.is_superuser}, is_staff: {a.is_staff}")

if admins.count() == 0:
    print("No admin users found! Creating superuser: admin / adminpass")
    User.objects.create_superuser(username='admin', email='admin@progressly.com', password='adminpass')
    print("Superuser created successfully!")
