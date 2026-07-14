import logging
import sys
from django.conf import settings
from django.utils import timezone
from django.utils.html import strip_tags
from .client import BrevoEmailClient
from .templates import render_html_email

logger = logging.getLogger(__name__)


def log_email_to_db(
    recipient_email,
    subject,
    email_type='system',
    status='sent',
    error_message=None,
    related_user=None,
    created_by='system',
    message_id=None
):
    """
    Creates an EmailLog entry. Never raises — must not break email sending flow.
    """
    try:
        from admin_dashboard.models import EmailLog
        EmailLog.objects.create(
            recipient_email=recipient_email,
            subject=subject,
            email_type=email_type,
            status=status,
            error_message=error_message,
            related_user=related_user,
            created_by=created_by,
            message_id=message_id,
        )
    except Exception as exc:
        logger.warning(f"[log_email_to_db] Could not write EmailLog: {exc}")


def send_email(to_email: str, subject: str, html_content: str, text_content: str = None, from_email: str = None, attachments=None, reply_to: str = None) -> str:
    """
    Sends email via Brevo REST API. Diverts to Django test outbox in test mode.
    Returns the messageId (or dummy test ID) on success.
    """
    if 'test' in sys.argv:
        try:
            from django.core import mail
            from django.core.mail import EmailMultiAlternatives
            
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content or strip_tags(html_content),
                from_email=from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@progressly.com'),
                to=[to_email]
            )
            msg.attach_alternative(html_content, "text/html")
            
            if not hasattr(mail, 'outbox'):
                mail.outbox = []
            mail.outbox.append(msg)
            logger.info(f"[Test Mode] Redirected email to Django mail.outbox: {to_email}")
            return "test-message-id"
        except Exception as e:
            logger.exception("Failed to write to mail.outbox in tests")
            return ""

    client = BrevoEmailClient()
    
    # Format Sender address
    if not from_email:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Progressly <progressly.offical@gmail.com>')
    
    from_name = getattr(settings, 'APP_NAME', 'Progressly')
    from_addr = from_email
    if '<' in from_email and '>' in from_email:
        parts = from_email.split('<')
        from_name = parts[0].strip()
        from_addr = parts[1].replace('>', '').strip()
        
    if not text_content:
        text_content = strip_tags(html_content)
        
    # Build Brevo API payload structure
    payload = {
        "sender": {
            "name": from_name,
            "email": from_addr
        },
        "to": [
            {
                "email": to_email
            }
        ],
        "subject": subject,
        "htmlContent": html_content,
        "textContent": text_content
    }
    
    if reply_to:
        payload["replyTo"] = {
            "email": reply_to
        }
        
    # Process attachments
    if attachments:
        import base64
        payload_attachments = []
        for att in attachments:
            if isinstance(att, dict) and 'content' in att and 'name' in att:
                payload_attachments.append(att)
            elif isinstance(att, tuple) and len(att) >= 2:
                filename, content = att[0], att[1]
                if isinstance(content, bytes):
                    b64_content = base64.b64encode(content).decode('utf-8')
                else:
                    b64_content = base64.b64encode(content.encode('utf-8')).decode('utf-8')
                payload_attachments.append({
                    "name": filename,
                    "content": b64_content
                })
        if payload_attachments:
            payload["attachment"] = payload_attachments
            
    return client.send_raw_email(payload)


def send_progressly_email(to_email, subject, title, message_html=None, button_text=None, button_url=None, html_content=None) -> str:
    if not to_email:
        raise ValueError("Email recipient missing")
        
    try:
        if not html_content:
            context = {
                'subject': subject,
                'title': title,
                'message_html': message_html,
                'button_text': button_text,
                'button_url': button_url,
                'frontend_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:5173'),
                'support_email': getattr(settings, 'ADMIN_EMAIL', 'mafaz9416@gmail.com'),
                'year': timezone.now().year
            }
            html_content = render_html_email("emails/base_email.html", context)
            
        text_content = strip_tags(html_content)
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '')
        return send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
            from_email=from_email
        )
    except Exception as e:
        logger.exception(f"Failed to send Progressly branded email to {to_email}: {e}")
        raise


def send_admin_notification_email(subject, title, message_html, button_text=None, button_url=None) -> str:
    if 'test' in sys.argv:
        admin_email = 'mafaz9416@gmail.com'
    else:
        admin_email = getattr(settings, 'ADMIN_EMAIL', 'mafaz9416@gmail.com') or 'mafaz9416@gmail.com'
        
    return send_progressly_email(
        to_email=admin_email,
        subject=subject,
        title=title,
        message_html=message_html,
        button_text=button_text,
        button_url=button_url
    )


def send_welcome_email(email_or_user, full_name=None) -> bool:
    if hasattr(email_or_user, 'email'):
        user = email_or_user
        email = user.email
        full_name = getattr(user, 'profile', None) and user.profile.full_name or user.first_name or user.username
    else:
        email = email_or_user
        user = None

    context = {
        "user_name": full_name,
        "frontend_url": getattr(settings, 'FRONTEND_URL', 'http://localhost:5173'),
        "support_email": getattr(settings, 'ADMIN_EMAIL', 'mafaz9416@gmail.com'),
        "year": timezone.now().year,
        "subject": "🚀 Welcome to Progressly"
    }

    try:
        html_message = render_html_email("emails/welcome_email.html", context)
    except Exception as e:
        logger.error(f"Failed to render welcome_email.html: {e}")
        html_message = f"<p>Hi {full_name},</p><p>Welcome to Progressly.</p>"

    subject_str = "🚀 Welcome to Progressly"
    try:
        result = send_progressly_email(
            to_email=email,
            subject=subject_str,
            title="Welcome to Progressly",
            html_content=html_message
        )
        msg_id = result if isinstance(result, str) else None
        log_email_to_db(email, subject_str, email_type='welcome', status='sent', related_user=user, message_id=msg_id)
        return bool(result)
    except Exception as e:
        log_email_to_db(email, subject_str, email_type='welcome', status='failed', related_user=user, error_message=str(e))
        return False


def send_feedback_confirmation(email_or_user, name=None, message="") -> bool:
    if hasattr(email_or_user, 'email'):
        user = email_or_user
        email = user.email
        name = getattr(user, 'profile', None) and user.profile.full_name or user.first_name or user.username
    else:
        email = email_or_user
        user = None

    context = {
        "user_name": name or 'User',
        "message": message,
        "frontend_url": getattr(settings, 'FRONTEND_URL', 'http://localhost:5173'),
        "support_email": getattr(settings, 'ADMIN_EMAIL', 'mafaz9416@gmail.com'),
        "year": timezone.now().year,
        "subject": "💜 Thanks for your feedback - Progressly"
    }

    try:
        html_message = render_html_email("emails/feedback_email.html", context)
    except Exception as e:
        logger.error(f"Failed to render feedback_email.html: {e}")
        html_message = f"<p>Hi {name or 'User'},</p><p>Thank you for sharing your feedback.</p>"

    subject_str = "💜 Thanks for your feedback - Progressly"
    try:
        result = send_progressly_email(
            to_email=email,
            subject=subject_str,
            title="Feedback Received",
            html_content=html_message
        )
        msg_id = result if isinstance(result, str) else None
        log_email_to_db(email, subject_str, email_type='feedback_reply', status='sent', related_user=user, message_id=msg_id)
        return bool(result)
    except Exception as e:
        log_email_to_db(email, subject_str, email_type='feedback_reply', status='failed', related_user=user, error_message=str(e))
        return False


def send_authenticated_feedback_thankyou(email, name, message="") -> bool:
    return send_feedback_confirmation(email, name, message)


def send_admin_feedback(name, email, feedback_type, date, message) -> bool:
    message_html = (
        f"<p>A new feedback has been submitted on Progressly.</p>"
        f"<p><strong>Name:</strong> {name}</p>"
        f"<p><strong>Email:</strong> {email}</p>"
        f"<p><strong>Type:</strong> {feedback_type}</p>"
        f"<p><strong>Date:</strong> {date}</p>"
        f"<p><strong>Message:</strong></p>"
        f"<blockquote>\"{message}\"</blockquote>"
    )
    subject_str = "[Feedback] Progressly"
    try:
        result = send_admin_notification_email(
            subject=subject_str,
            title="New System Feedback Received",
            message_html=message_html
        )
        msg_id = result if isinstance(result, str) else None
        admin_email = getattr(settings, 'ADMIN_EMAIL', 'mafaz9416@gmail.com') or 'mafaz9416@gmail.com'
        log_email_to_db(admin_email, subject_str, email_type='admin_notification', status='sent', message_id=msg_id)
        return bool(result)
    except Exception as e:
        admin_email = getattr(settings, 'ADMIN_EMAIL', 'mafaz9416@gmail.com') or 'mafaz9416@gmail.com'
        log_email_to_db(admin_email, subject_str, email_type='admin_notification', status='failed', error_message=str(e))
        return False


def send_password_reset_email(email, full_name, token) -> bool:
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    reset_url = f"{frontend_url.rstrip('/')}/reset-password/{token}"
    context = {
        "user_name": full_name,
        "reset_url": reset_url,
        "frontend_url": frontend_url,
        "support_email": getattr(settings, 'ADMIN_EMAIL', 'mafaz9416@gmail.com'),
        "year": timezone.now().year,
        "subject": "Reset Your Password - Progressly"
    }

    try:
        html_message = render_html_email("emails/password_reset_email.html", context)
    except Exception as e:
        logger.error(f"Failed to render password_reset_email.html: {e}")
        html_message = f"<p>Hi {full_name},</p><p>Please click here to reset password: {reset_url}</p>"

    subject_str = "Reset Your Password - Progressly"
    try:
        result = send_progressly_email(
            to_email=email,
            subject=subject_str,
            title="Password Reset Request",
            html_content=html_message
        )
        msg_id = result if isinstance(result, str) else None
        log_email_to_db(email, subject_str, email_type='password_reset', status='sent', message_id=msg_id)
        return bool(result)
    except Exception as e:
        log_email_to_db(email, subject_str, email_type='password_reset', status='failed', error_message=str(e))
        return False


def send_password_changed_email(email, full_name) -> bool:
    context = {
        "user_name": full_name,
        "frontend_url": getattr(settings, 'FRONTEND_URL', 'http://localhost:5173'),
        "support_email": getattr(settings, 'ADMIN_EMAIL', 'mafaz9416@gmail.com'),
        "year": timezone.now().year,
        "subject": "Password Changed Successfully - Progressly"
    }

    try:
        html_message = render_html_email("emails/password_changed_email.html", context)
    except Exception as e:
        logger.error(f"Failed to render password_changed_email.html: {e}")
        html_message = f"<p>Hi {full_name},</p><p>Your password was changed successfully.</p>"

    subject_str = "Password Changed Successfully - Progressly"
    try:
        result = send_progressly_email(
            to_email=email,
            subject=subject_str,
            title="Password Updated",
            html_content=html_message
        )
        msg_id = result if isinstance(result, str) else None
        log_email_to_db(email, subject_str, email_type='password_change', status='sent', message_id=msg_id)
        return bool(result)
    except Exception as e:
        log_email_to_db(email, subject_str, email_type='password_change', status='failed', error_message=str(e))
        return False


def send_account_deleted_email(email, full_name) -> bool:
    context = {
        "user_name": full_name or 'User',
        "frontend_url": getattr(settings, 'FRONTEND_URL', 'http://localhost:5173'),
        "support_email": getattr(settings, 'ADMIN_EMAIL', 'mafaz9416@gmail.com'),
        "year": timezone.now().year,
        "subject": "Account Deleted - Progressly"
    }

    try:
        html_message = render_html_email("emails/account_deleted_email.html", context)
    except Exception as e:
        logger.error(f"Failed to render account_deleted_email.html: {e}")
        html_message = f"<p>Hi {full_name or 'User'},</p><p>Your account was deleted.</p>"

    subject_str = "Account Deleted - Progressly"
    try:
        result = send_progressly_email(
            to_email=email,
            subject=subject_str,
            title="Account Deleted",
            html_content=html_message
        )
        msg_id = result if isinstance(result, str) else None
        log_email_to_db(email, subject_str, email_type='account_deletion', status='sent', message_id=msg_id)
        return bool(result)
    except Exception as e:
        log_email_to_db(email, subject_str, email_type='account_deletion', status='failed', error_message=str(e))
        return False


def send_admin_reset_password_email(email, full_name) -> bool:
    context = {
        "user_name": full_name,
        "frontend_url": getattr(settings, 'FRONTEND_URL', 'http://localhost:5173'),
        "support_email": getattr(settings, 'ADMIN_EMAIL', 'mafaz9416@gmail.com'),
        "year": timezone.now().year,
        "subject": "Password Reset - Progressly Admin"
    }

    try:
        html_message = render_html_email("emails/admin_reset_password_email.html", context)
    except Exception as e:
        logger.error(f"Failed to render admin_reset_password_email.html: {e}")
        html_message = f"<p>Hi {full_name},</p><p>Your password was reset by an admin.</p>"

    subject_str = "Password Reset - Progressly Admin"
    try:
        result = send_progressly_email(
            to_email=email,
            subject=subject_str,
            title="Password Reset by Admin",
            html_content=html_message
        )
        msg_id = result if isinstance(result, str) else None
        log_email_to_db(email, subject_str, email_type='admin_password_reset', status='sent', message_id=msg_id)
        return bool(result)
    except Exception as e:
        log_email_to_db(email, subject_str, email_type='admin_password_reset', status='failed', error_message=str(e))
        return False
