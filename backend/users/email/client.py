import logging
import time
import requests
from django.conf import settings
from .exceptions import (
    EmailError,
    EmailRateLimitError,
    EmailConnectionError,
    EmailSendError,
    EmailAuthenticationError,
)

logger = logging.getLogger(__name__)


class BrevoEmailClient:
    def __init__(self):
        self.api_url = getattr(settings, 'BREVO_API_URL', 'https://api.brevo.com/v3/smtp/email')
        self.api_key = getattr(settings, 'BREVO_API_KEY', '')
        self.timeout = 15  # 15 seconds request timeout

    def send_raw_email(self, payload: dict) -> str:
        """
        Sends an email payload using Brevo REST API with retries, exponential backoff, and masked logging.
        Returns the accepted messageId on success.
        """
        if not self.api_key:
            logger.error("[BrevoEmailClient] API Key is missing or empty.")
            raise EmailAuthenticationError("Brevo API Key is not configured.")

        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": self.api_key
        }

        to_emails = [recipient.get("email") for recipient in payload.get("to", [])]
        subject = payload.get("subject", "")
        logger.info("[BrevoEmailClient] Initiating send request for recipients %s (Subject: '%s')", to_emails, subject)

        max_retries = 3
        retry_delay = 1.0

        for attempt in range(max_retries):
            try:
                response = requests.post(self.api_url, json=payload, headers=headers, timeout=self.timeout)

                # HTTP 429: Rate Limit
                if response.status_code == 429:
                    logger.warning("[BrevoEmailClient] Rate limited (HTTP 429) on attempt %d of %d.", attempt + 1, max_retries)
                    if attempt < max_retries - 1:
                        time.sleep(2.0)
                        continue
                    raise EmailRateLimitError("Brevo REST API rate limit exceeded.")

                # HTTP 200, 201, 202: Success
                if response.status_code in [200, 201, 202]:
                    try:
                        resp_data = response.json()
                        message_id = resp_data.get("messageId")
                        if not message_id:
                            logger.warning("[BrevoEmailClient] Success status returned but 'messageId' is missing in response.")
                            message_id = "unknown_message_id"
                        logger.info("[BrevoEmailClient] Email sent successfully to %s. messageId: %s", to_emails, message_id)
                        return message_id
                    except Exception as json_err:
                        logger.warning("[BrevoEmailClient] Failed to parse success response JSON: %s", str(json_err))
                        return "unknown_message_id"

                # HTTP 5xx: Transient Server Error
                if response.status_code >= 500:
                    logger.warning("[BrevoEmailClient] Transient server error (HTTP %s) on attempt %d of %d.", 
                                   response.status_code, attempt + 1, max_retries)
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay)
                        retry_delay *= 2.0
                        continue

                # Non-transient errors (HTTP 4xx other than 429)
                logger.error("[BrevoEmailClient] Non-transient failure. Status code: %s, Response: %s", 
                             response.status_code, response.text)
                raise EmailSendError(f"Brevo API error: {response.status_code} - {response.text}")

            except requests.exceptions.RequestException as e:
                logger.warning("[BrevoEmailClient] Connection or timeout exception on attempt %d: %s", attempt + 1, str(e))
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    retry_delay *= 2.0
                else:
                    logger.exception("[BrevoEmailClient] Request failed after all retry attempts.")
                    raise EmailConnectionError(f"Failed to connect to Brevo REST API: {str(e)}")

        raise EmailSendError("Brevo Email API failed after maximum retries.")

    def test_connectivity(self) -> dict:
        """
        Lightweight authentication test using GET https://api.brevo.com/v3/account.
        Measures response latency and catches credentials degradation.
        """
        if not self.api_key:
            return {"status": "Offline", "latency_ms": None, "detail": "API key not configured."}

        url = "https://api.brevo.com/v3/account"
        headers = {
            "accept": "application/json",
            "api-key": self.api_key
        }

        start_time = time.time()
        try:
            response = requests.get(url, headers=headers, timeout=5)
            latency = round((time.time() - start_time) * 1000, 1)

            if response.status_code == 200:
                return {"status": "Operational", "latency_ms": latency}
            elif response.status_code in [401, 403]:
                return {"status": "Degraded", "latency_ms": latency, "detail": "Authentication failed (Invalid Key)."}
            else:
                return {"status": "Degraded", "latency_ms": latency, "detail": f"Server returned status {response.status_code}."}
        except Exception as e:
            logger.error(f"[BrevoEmailClient] Connectivity verification failed: {str(e)}")
            return {"status": "Offline", "latency_ms": None, "detail": str(e)}
