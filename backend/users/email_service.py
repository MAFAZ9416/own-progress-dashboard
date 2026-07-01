import os
import logging
import time
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from email.mime.image import MIMEImage

logger = logging.getLogger(__name__)

def send_html_email(subject, template_name, context, to_email):
    """
    Core helper to send HTML emails with an inline logo attachment.
    All exceptions are caught and logged so that caller processes do not fail.
    """
    try:
        # Load and render template to HTML
        html_content = render_to_string(template_name, context)
        # Strip html tags to generate text fallback
        text_content = strip_tags(html_content)
        
        from_email = settings.EMAIL_HOST_USER
        
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[to_email]
        )
        msg.attach_alternative(html_content, "text/html")
        
        # Attach the logo inline
        logo_path = os.path.join(settings.BASE_DIR, 'static', 'email', 'logo.png')
        if os.path.exists(logo_path):
            with open(logo_path, 'rb') as f:
                msg_image = MIMEImage(f.read())
                msg_image.add_header('Content-ID', '<logo>')
                msg_image.add_header('Content-Disposition', 'inline', filename='logo.png')
                msg.attach(msg_image)
        else:
            logger.warning(f"Logo file not found at: {logo_path}")

        start = time.time()
        msg.send(fail_silently=False)
        elapsed = time.time() - start
        logger.info(f"Email sent to {to_email} in {elapsed:.2f} seconds")
        
        # Log to DB
        try:
            from admin_panel.models import EmailLog
            EmailLog.objects.create(
                recipient=to_email,
                subject=subject,
                template_name=template_name,
                status='delivered'
            )
        except Exception as e_log:
            logger.error(f"Failed to log email success to DB: {e_log}")

        return True
    except Exception as e:
        logger.exception(f"Failed to send email to {to_email} using template {template_name}: {str(e)}")
        
        # Log to DB
        try:
            from admin_panel.models import EmailLog
            EmailLog.objects.create(
                recipient=to_email,
                subject=subject,
                template_name=template_name,
                status='failed',
                error_message=str(e)
            )
        except Exception as e_log:
            logger.error(f"Failed to log email failure to DB: {e_log}")

        return False

def send_welcome_email(email, full_name):
    context = {
        'full_name': full_name,
        'dashboard_url': settings.FRONTEND_URL
    }
    return send_html_email(
        subject="Welcome to Own Progress Dashboard",
        template_name="emails/welcome.html",
        context=context,
        to_email=email
    )

def send_feedback_confirmation(email, name):
    context = {
        'name': name or "valued user"
    }
    return send_html_email(
        subject="Thank you for your feedback",
        template_name="emails/feedback_received.html",
        context=context,
        to_email=email
    )

def send_admin_feedback(name, email, feedback_type, date, message):
    context = {
        'name': name,
        'email': email,
        'feedback_type': feedback_type,
        'date': date,
        'message': message
    }
    return send_html_email(
        subject="[Feedback] Own Progress Dashboard",
        template_name="emails/feedback_admin.html",
        context=context,
        to_email="mafaz9416@gmail.com"
    )

def send_password_reset_email(email, full_name, token):
    reset_url = f"{settings.FRONTEND_URL}/reset-password/{token}"
    context = {
        'full_name': full_name,
        'reset_url': reset_url
    }
    return send_html_email(
        subject="Reset Your Password",
        template_name="emails/forgot_password.html",
        context=context,
        to_email=email
    )

def send_password_changed_email(email, full_name):
    context = {
        'full_name': full_name
    }
    return send_html_email(
        subject="Password Changed Successfully",
        template_name="emails/password_changed.html",
        context=context,
        to_email=email
    )

def send_account_deleted_email(email, full_name):
    context = {
        'full_name': full_name or "User"
    }
    return send_html_email(
        subject="Your Own Progress Dashboard account has been deleted",
        template_name="emails/account_deleted.html",
        context=context,
        to_email=email
    )
