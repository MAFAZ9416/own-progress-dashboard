import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import authenticate

user = authenticate(username="test123456@gmail.com", password="test12345()")
print("Authenticated user with email:", user)

user2 = authenticate(username="test123456", password="test12345()")
print("Authenticated user with username:", user2)
