import hashlib
from typing import Any

from litestar.connection import Request
from litestar.exceptions.http_exceptions import ImproperlyConfiguredException
from litestar.middleware.rate_limit import RateLimitMiddleware

from src.backend.models import User


class BrowserFingerprint:
    """Generate browser fingerprints for session identification."""

    @staticmethod
    def generate_fingerprint(request: Request) -> str:
        """Generate a browser fingerprint from request headers.

        Returns:
            A browser fingerprint string.

        """
        fingerprint_data = []

        # IP address (with fallback for proxies)
        client_ip = (
            request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
            or request.headers.get("X-Real-IP", "")
            or request.client.host
            if request.client
            else "unknown"
        )
        fingerprint_data.append(f"ip:{client_ip}")

        # User agent (most stable identifier)
        user_agent = request.headers.get("User-Agent", "unknown")
        fingerprint_data.append(f"ua:{user_agent}")

        # Accept language (relatively stable)
        accept_language = request.headers.get("Accept-Language", "unknown")
        fingerprint_data.append(f"lang:{accept_language}")

        # Accept encoding (stable for same browser)
        accept_encoding = request.headers.get("Accept-Encoding", "unknown")
        fingerprint_data.append(f"enc:{accept_encoding}")

        # Host header (for multi-tenant scenarios)
        host = request.headers.get("Host", "unknown")
        fingerprint_data.append(f"host:{host}")

        # Combine all data and hash
        combined = "|".join(fingerprint_data)

        # Use SHA-256 for consistent, collision-resistant fingerprint
        fingerprint_hash = hashlib.sha256(combined.encode("utf-8")).hexdigest()

        return f"browser_{fingerprint_hash[:32]}"

    @staticmethod
    def get_stable_user_id(request: Request) -> str:
        """Get a stable user ID based on browser fingerprint.

        Returns:
            A stable user identification string.

        """
        return BrowserFingerprint.generate_fingerprint(request)


class CustomRateLimitMiddleware(RateLimitMiddleware):
    """Custom rate limiting middleware.

    Uses user ID for logged in users and browser fingerprint for anonymous users.
    """

    def cache_key_from_request(self, request: Request[User, Any, Any]) -> str:
        """Get a cache-key from a ``Request`` using user ID or browser fingerprint.

        Args:
            request: A litestar Request instance.

        Returns:
            A cache key.

        """
        try:
            user = getattr(request, "user", None)
        except ImproperlyConfiguredException:
            user = None

        if user and isinstance(user, User) and hasattr(user, "id"):
            identifier = f"user_{user.id}"
        else:
            identifier = BrowserFingerprint.get_stable_user_id(request)

        route_handler = request.scope["route_handler"]
        if getattr(route_handler, "is_mount", False):
            identifier += "::mount"

        if getattr(route_handler, "is_static", False):
            identifier += "::static"

        return f"{type(self).__name__}::{identifier}"
