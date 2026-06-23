from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.mail import get_connection

class Command(BaseCommand):
    help = 'Check email configuration and SMTP connection'

    def handle(self, *args, **options):
        host = getattr(settings, 'EMAIL_HOST', None)
        port = getattr(settings, 'EMAIL_PORT', None)
        user = getattr(settings, 'EMAIL_HOST_USER', None)
        password = getattr(settings, 'EMAIL_HOST_PASSWORD', None)
        frontend_url = getattr(settings, 'FRONTEND_URL', None)

        print(f"EMAIL_HOST ........ {'OK' if host else 'FAILED'}")
        print(f"EMAIL_PORT ........ {'OK' if port else 'FAILED'}")
        print(f"EMAIL_USER ........ {'OK' if user else 'FAILED'}")
        print(f"PASSWORD .......... {'OK' if password else 'FAILED'}")
        print(f"FRONTEND_URL ...... {'OK' if frontend_url else 'FAILED'}")

        # Check SMTP Connection
        try:
            # We open a connection to see if it succeeds
            connection = get_connection(fail_silently=False)
            connection.open()
            connection.close()
            print("SMTP CONNECTION ... OK")
        except Exception as e:
            # If we are using the placeholder password or have no network, connection fails.
            # This is expected behavior during audit if the developer hasn't configured their real password.
            # We print FAILED along with the reason.
            print(f"SMTP CONNECTION ... FAILED ({str(e)})")
