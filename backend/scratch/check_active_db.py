from django.db import connection
from django.contrib.auth import get_user_model
from skills.models import Skill
from tasks.models import Task
from streaks.models import Streak

print("Active Database Configuration:")
print("  Engine:", connection.settings_dict['ENGINE'])
print("  Name:", connection.settings_dict['NAME'])

User = get_user_model()
try:
    print("\nDatabase Counts:")
    print("  Users:", User.objects.count())
    print("  Skills:", Skill.objects.count())
    print("  Tasks:", Task.objects.count())
    print("  Streaks:", Streak.objects.count())
except Exception as e:
    print("Error querying counts:", str(e))
