import os
import sys
import django

# Add backend root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.email_service import send_welcome_email, send_feedback_confirmation

email_to = "mafaz9416@gmail.com"

print(f"Sending test welcome email to {email_to}...")
welcome_res = send_welcome_email(email_to, "Test User")
print("Welcome email send status:", welcome_res)

print(f"Sending test feedback confirmation email to {email_to}...")
feedback_res = send_feedback_confirmation(email_to, "Test User", "This is an automated test feedback suggestion.")
print("Feedback email send status:", feedback_res)
