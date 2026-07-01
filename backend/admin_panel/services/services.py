from admin_panel.models import ActivityLog

def log_activity(request, action, details, severity="info"):
    """
    Utility helper service to audit critical user/admin actions.
    Logs IP address, User Agent, severity level, and associated actor.
    """
    ip_addr = "127.0.0.1"
    user_agent = "N/A"
    
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_addr = x_forwarded_for.split(',')[0].strip()
        else:
            ip_addr = request.META.get('REMOTE_ADDR', '127.0.0.1')
        user_agent = request.META.get('HTTP_USER_AGENT', 'N/A')

    ActivityLog.objects.create(
        actor=request.user if (request and request.user and request.user.is_authenticated) else None,
        action=action,
        details=details,
        severity=severity,
        ip_address=ip_addr,
        user_agent=user_agent
    )
