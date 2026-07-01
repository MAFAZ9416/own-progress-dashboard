import datetime
from django.utils import timezone
from .models import UserLoginHistory

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

class ActiveUserMiddleware:
    """
    Middleware to track user login sessions and last active status for
    the custom enterprise admin dashboard metrics.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Only track if user is authenticated and saved in database
        if request.user and request.user.is_authenticated and request.user.pk is not None:
            ip = get_client_ip(request)
            ua = request.META.get('HTTP_USER_AGENT', '')
            
            # Find recent active session within last 4 hours
            four_hours_ago = timezone.now() - datetime.timedelta(hours=4)
            history = UserLoginHistory.objects.filter(
                user=request.user,
                is_active_session=True,
                login_time__gte=four_hours_ago
            ).order_by('-login_time').first()

            if history:
                # Update last active time (auto_now fields update automatically on save)
                history.save()
            else:
                # Create a new login record
                UserLoginHistory.objects.create(
                    user=request.user,
                    ip_address=ip,
                    user_agent=ua,
                    is_active_session=True
                )
                
        return response
