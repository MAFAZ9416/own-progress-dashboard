class EmailError(Exception):
    """Base exception for all email-related errors."""
    pass


class EmailConnectionError(EmailError):
    """Raised when email client cannot connect to the REST API server."""
    pass


class EmailSendError(EmailError):
    """Raised when the REST API returns a non-transient failure status."""
    pass


class EmailRateLimitError(EmailError):
    """Raised when the REST API returns HTTP 429 (rate-limited)."""
    pass


class EmailAuthenticationError(EmailError):
    """Raised when the REST API key is missing or invalid."""
    pass
