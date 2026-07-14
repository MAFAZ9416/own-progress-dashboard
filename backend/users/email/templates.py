import logging
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def render_html_email(template_name: str, context: dict) -> str:
    """
    Renders an HTML email template and dynamically replaces CID logo placeholders
    with EMAIL_LOGO_URL configuration.
    """
    logo_url = getattr(settings, 'EMAIL_LOGO_URL', 'https://progressly-backend-dlbb.onrender.com/static/email/logo.png')
    
    try:
        html_content = render_to_string(template_name, context)
        if html_content:
            html_content = html_content.replace('cid:progressly_logo', logo_url)
        return html_content
    except Exception as e:
        logger.exception(f"Failed to render HTML email template '{template_name}': {str(e)}")
        raise e
