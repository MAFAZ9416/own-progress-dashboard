import os
import logging
import time
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from email.mime.image import MIMEImage

logger = logging.getLogger(__name__)

def send_progressly_email(to_email, subject, title, message_html, button_text=None, button_url=None):
    """
    Centralized Progressly HTML email dispatcher.
    Uses base_email.html, attaches text fallback, and attaches the logo inline as CID.
    """
    try:
        from django.templatetags.static import static
        logo_url = settings.SITE_URL.rstrip('/') + static("email/logo.png")
        
        context = {
            'subject': subject,
            'logo_url': logo_url,
            'title': title,
            'message_html': message_html,
            'button_text': button_text,
            'button_url': button_url
        }
        
        # Render HTML template
        html_content = render_to_string("emails/base_email.html", context)
        # Strip tags for a clean plaintext fallback
        text_content = strip_tags(html_content)
        
        from_email = settings.EMAIL_HOST_USER
        
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

def send_welcome_email(email, full_name):
    message_html = (
        f"<p>Hi {full_name},</p>"
        "<p>Welcome to Progressly.</p>"
        "<p>Start tracking your skills, tasks, streaks, and growth journey.</p>"
    )
    return send_progressly_email(
        to_email=email,
        subject="🚀 Welcome to Progressly",
        title="Welcome to Progressly",
        message_html=message_html,
        button_text="Open Dashboard",
        button_url=settings.FRONTEND_URL
    )

def send_feedback_confirmation(email, name, message=""):
    message_html = (
        f"<p>Hi {name or 'User'},</p>"
        "<p>Thank you for sharing your feedback.</p>"
        "<p>We received:</p>"
        f"<blockquote>\"{message}\"</blockquote>"
        "<p>Your ideas help us improve Progressly.</p>"
        "<p>Team Progressly</p>"
    )
    return send_progressly_email(
        to_email=email,
        subject="💜 Thanks for your feedback - Progressly",
        title="Feedback Received",
        message_html=message_html
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
    return send_progressly_email(
        to_email="mafaz9416@gmail.com",
        subject="[Feedback] Progressly",
        title="New System Feedback Received",
        message_html=message_html
    )

def send_password_reset_email(email, full_name, token):
    reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password/{token}"
    message_html = (
        f"<p>Hi {full_name},</p>"
        "<p>We received a request to reset your password for your Progressly account.</p>"
        "<p>Please click the button below to secure your account and set a new password. "
        "If you did not request this, you can safely ignore this email.</p>"
    )
    return send_progressly_email(
        to_email=email,
        subject="Reset Your Password - Progressly",
        title="Password Reset Request",
        message_html=message_html,
        button_text="Reset Password",
        button_url=reset_url
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
