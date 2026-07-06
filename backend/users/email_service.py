import os
import logging
import time
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from email.mime.image import MIMEImage

logger = logging.getLogger(__name__)

def send_progressly_email(to_email, subject, title, message_html=None, button_text=None, button_url=None, html_content=None):
    """
    Centralized Progressly HTML email dispatcher.
    Uses base_email.html (or pre-rendered html_content), attaches text fallback, and attaches the logo inline as CID.
    """
    if not to_email:
        raise ValueError("Email recipient missing")

    try:
        from django.utils import timezone
        
        if not html_content:
            from django.templatetags.static import static
            logo_url = settings.SITE_URL.rstrip('/') + static("email/logo.png")
            
            context = {
                'subject': subject,
                'logo_url': logo_url,
                'title': title,
                'message_html': message_html,
                'button_text': button_text,
                'button_url': button_url,
                'frontend_url': settings.FRONTEND_URL,
                'support_email': settings.ADMIN_EMAIL,
                'year': timezone.now().year
            }
            
            # Render HTML template with robust error wrapping
            try:
                html_content = render_to_string("emails/base_email.html", context)
            except Exception as e:
                logger.error(f"Failed to render email template base_email.html: {e}")
                raise e
            
        # Strip tags for a clean plaintext fallback
        text_content = strip_tags(html_content)
        
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER)
        
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[to_email]
        )
        msg.attach_alternative(html_content, "text/html")
        
        # Attach the logo inline as a CID attachment
        logo_path = os.path.join(settings.BASE_DIR, 'static', 'email', 'logo.png')
        if os.path.exists(logo_path):
            with open(logo_path, 'rb') as f:
                logo = MIMEImage(f.read())
                logo.add_header("Content-ID", "<progressly_logo>")
                logo.add_header("Content-Disposition", "inline")
                msg.attach(logo)
        else:
            logger.warning(f"Static email logo not found at {logo_path}")
        
        start = time.time()
        msg.send(fail_silently=False)
        elapsed = time.time() - start
        logger.info(f"Progressly branded email sent to {to_email} in {elapsed:.2f} seconds")
        return True
    except Exception as e:
        logger.exception(f"Failed to send Progressly branded email to {to_email}: {e}")
        return False

def send_admin_notification_email(subject, title, message_html, button_text=None, button_url=None):
    """
    Dispatcher for administrative alerts and notification emails.
    Sends notifications to settings.ADMIN_EMAIL.
    """
    import sys
    if 'test' in sys.argv:
        admin_email = 'mafaz9416@gmail.com'
    else:
        admin_email = getattr(settings, 'ADMIN_EMAIL', 'mafaz9416@gmail.com')
        if not admin_email:
            admin_email = 'mafaz9416@gmail.com'
    return send_progressly_email(
        to_email=admin_email,
        subject=subject,
        title=title,
        message_html=message_html,
        button_text=button_text,
        button_url=button_url
    )

def send_welcome_email(email_or_user, full_name=None):
    if hasattr(email_or_user, 'email'):
        user = email_or_user
        email = user.email
        full_name = getattr(user, 'profile', None) and user.profile.full_name or user.first_name or user.username
    else:
        email = email_or_user

    from django.utils import timezone
    context = {
        "user_name": full_name,
        "frontend_url": settings.FRONTEND_URL,
        "support_email": settings.ADMIN_EMAIL,
        "year": timezone.now().year,
        "subject": "🚀 Welcome to Progressly"
    }

    try:
        html_message = render_to_string("emails/welcome_email.html", context)
    except Exception as e:
        logger.error(f"Failed to render welcome_email.html: {e}")
        html_message = f"<p>Hi {full_name},</p><p>Welcome to Progressly.</p>"

    return send_progressly_email(
        to_email=email,
        subject="🚀 Welcome to Progressly",
        title="Welcome to Progressly",
        html_content=html_message
    )

def send_feedback_confirmation(email_or_user, name=None, message=""):
    if hasattr(email_or_user, 'email'):
        user = email_or_user
        email = user.email
        name = getattr(user, 'profile', None) and user.profile.full_name or user.first_name or user.username
    else:
        email = email_or_user

    from django.utils import timezone
    context = {
        "user_name": name or 'User',
        "message": message,
        "frontend_url": settings.FRONTEND_URL,
        "support_email": settings.ADMIN_EMAIL,
        "year": timezone.now().year,
        "subject": "💜 Thanks for your feedback - Progressly"
    }

    try:
        html_message = render_to_string("emails/feedback_email.html", context)
    except Exception as e:
        logger.error(f"Failed to render feedback_email.html: {e}")
        html_message = f"<p>Hi {name or 'User'},</p><p>Thank you for sharing your feedback.</p>"

    return send_progressly_email(
        to_email=email,
        subject="💜 Thanks for your feedback - Progressly",
        title="Feedback Received",
        html_content=html_message
    )

def send_authenticated_feedback_thankyou(email, name, message=""):
    return send_feedback_confirmation(email, name, message)

def send_admin_feedback(name, email, feedback_type, date, message):
    message_html = (
        f"<p>A new feedback has been submitted on Progressly.</p>"
        f"<p><strong>Name:</strong> {name}</p>"
        f"<p><strong>Email:</strong> {email}</p>"
        f"<p><strong>Type:</strong> {feedback_type}</p>"
        f"<p><strong>Date:</strong> {date}</p>"
        f"<p><strong>Message:</strong></p>"
        f"<blockquote>\"{message}\"</blockquote>"
    )
    return send_admin_notification_email(
        subject="[Feedback] Progressly",
        title="New System Feedback Received",
        message_html=message_html
    )

def send_password_reset_email(email, full_name, token):
    reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password/{token}"
    from django.utils import timezone
    context = {
        "user_name": full_name,
        "reset_url": reset_url,
        "frontend_url": settings.FRONTEND_URL,
        "support_email": settings.ADMIN_EMAIL,
        "year": timezone.now().year,
        "subject": "Reset Your Password - Progressly"
    }

    try:
        html_message = render_to_string("emails/password_reset_email.html", context)
    except Exception as e:
        logger.error(f"Failed to render password_reset_email.html: {e}")
        html_message = f"<p>Hi {full_name},</p><p>Please click here to reset password: {reset_url}</p>"

    return send_progressly_email(
        to_email=email,
        subject="Reset Your Password - Progressly",
        title="Password Reset Request",
        html_content=html_message
    )

def send_password_changed_email(email, full_name):
    message_html = (
        f"<p>Hi {full_name},</p>"
        "<p>This is a confirmation that the password for your Progressly account has been successfully changed.</p>"
        "<p>If you did not make this change, please contact support immediately to secure your account.</p>"
    )
    return send_progressly_email(
        to_email=email,
        subject="Password Changed Successfully - Progressly",
        title="Password Updated",
        message_html=message_html
    )

def send_account_deleted_email(email, full_name):
    message_html = (
        f"<p>Hi {full_name or 'User'},</p>"
        "<p>As requested, your Progressly account has been deleted, and all your records have been removed from our system.</p>"
        "<p>We're sorry to see you go! If you ever decide to return, you can register a new account anytime.</p>"
    )
    return send_progressly_email(
        to_email=email,
        subject="Account Deleted - Progressly",
        title="Account Deleted",
        message_html=message_html
    )

def send_admin_reset_password_email(email, full_name):
    message_html = (
        f"<p>Hi {full_name},</p>"
        "<p>Your Progressly password was updated by an administrator.</p>"
        "<p>If you did not expect this or have any concerns, please contact your systems administrator.</p>"
    )
    return send_progressly_email(
        to_email=email,
        subject="Password Reset - Progressly Admin",
        title="Password Reset by Admin",
        message_html=message_html,
        button_text="Go to Dashboard",
        button_url=f"{settings.FRONTEND_URL.rstrip('/')}/dashboard"
    )

