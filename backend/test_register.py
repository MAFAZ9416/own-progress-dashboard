import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.serializers import RegisterSerializer

data = {
    "username": "welcome",
    "email": "welcome@gmail.com",
    "password": "welcome123",
    "password2": "welcome123"
}

serializer = RegisterSerializer(data=data)
print("Is valid?", serializer.is_valid())
if not serializer.is_valid():
    print("Errors:", serializer.errors)
