import json
import logging
import time
from django.conf import settings
from django.db import transaction
from pywebpush import webpush, WebPushException

logger = logging.getLogger(__name__)

# VAPID setup: read from settings, or fall back to safe default mock keys for local development
VAPID_PUBLIC_KEY = getattr(
    settings, 
    'VAPID_PUBLIC_KEY', 
    'BCzS0k4zJp_3pL1z9G4N_Q4m6z1Q4V7T3j6r5q6e6m6x6e6r5q6e6r5q6e6r5q6e6r5q6e6r5q6e6r5q6e6w'
)
VAPID_PRIVATE_KEY = getattr(
    settings, 
    'VAPID_PRIVATE_KEY', 
    'AB_CD_EF_GH_IJ_KL_MN'
)
VAPID_CLAIMS = getattr(
    settings, 
    'VAPID_CLAIMS', 
    {"sub": "mailto:admin@progressly.com"}
)

def send_push_notification(subscription, payload):
    """
    Delivers a Web Push notification to a specific subscriber,
    retrying up to 5 times with backoff delays.
    """
    subscription_info = {
        "endpoint": subscription.endpoint,
        "keys": {
            "p256dh": subscription.p256dh,
            "auth": subscription.auth
        }
    }

    retry_delays = [0, 2, 5, 15, 30]
    success = False

    for attempt in range(5):
        if attempt > 0:
            time.sleep(retry_delays[attempt])

        try:
            # Send push payload signed with VAPID
            webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload),
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS.copy(),
            )
            success = True
            break
        except WebPushException as ex:
            logger.warning(f"Push notification delivery failed on attempt {attempt+1}: {ex}")
            # If GCM/FCM responds with 404/410, the subscription has expired or is invalid. Delete it.
            if ex.response is not None and ex.response.status_code in [404, 410]:
                try:
                    with transaction.atomic():
                        subscription.delete()
                except Exception as del_err:
                    logger.error(f"Failed to delete stale push subscription: {del_err}")
                break

    if not success:
        # Create an administrative log entry on permanent failure
        try:
            from admin_dashboard.models import AdminActivityLog
            AdminActivityLog.objects.create(
                action="WebPush Delivery Failure",
                details=f"Permanent failure for user {subscription.user.email if subscription.user else 'Anonymous'} on endpoint {subscription.endpoint[:60]}..."
            )
        except Exception as log_err:
            logger.error(f"Could not log PWA push failure: {log_err}")

    return success

def broadcast_push_notification(users, payload):
    """
    Broadcasts a push notification to a list of users.
    """
    from .models import PushSubscription
    subscriptions = PushSubscription.objects.filter(user__in=users)
    for sub in subscriptions:
        # Run asynchronously or in-sequence
        send_push_notification(sub, payload)
