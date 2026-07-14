import logging
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def render_html_email(template_name: str, context: dict) -> str:
    """
    Renders an HTML email template, injecting email_logo_url into the context
    and replacing legacy cid:progressly_logo references.
    """
    logo_url = getattr(settings, 'EMAIL_LOGO_URL', None)
    if not logo_url:
        from django.core.exceptions import ImproperlyConfigured
        raise ImproperlyConfigured("EMAIL_LOGO_URL environment variable is missing.")

    # Inject logo URL directly into template context
    context = context.copy()
    context['email_logo_url'] = logo_url

    try:
        html_content = render_to_string(template_name, context)
        if html_content:
            html_content = html_content.replace('cid:progressly_logo', logo_url)
        return html_content
    except Exception as e:
        logger.exception(f"Failed to render HTML email template '{template_name}': {str(e)}")
        raise e
