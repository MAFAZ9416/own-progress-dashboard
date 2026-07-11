from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    pass

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=100, blank=True)
    avatar = models.ImageField(upload_to='profiles/', blank=True, null=True)
    bio = models.TextField(blank=True, max_length=150)
    country = models.CharField(max_length=100, blank=True, null=True)
    notifications_enabled = models.BooleanField(default=True)
    preferences = models.JSONField(default=dict, blank=True)
    public_slug = models.SlugField(max_length=80, unique=True, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    def generate_public_slug(self):
        """
        Generate a unique public slug from full_name or username.
        Format: <name-slug>-<4-char-uuid>
        Never uses email to avoid exposing it in the URL.
        """
        import re
        import uuid

        base = self.full_name or self.user.username or ''
        # Strip email if base happens to be an email
        if '@' in base:
            base = base.split('@')[0]
        # Slugify: lowercase, replace non-alphanumeric with hyphens
        slug_base = re.sub(r'[^a-z0-9]+', '-', base.lower()).strip('-') or 'user'
        # Add short UUID suffix for uniqueness
        suffix = uuid.uuid4().hex[:6]
        return f"{slug_base[:40]}-{suffix}"

    def save(self, *args, **kwargs):
        if not self.public_slug:
            slug = self.generate_public_slug()
            # Ensure uniqueness (collision retry)
            while UserProfile.objects.filter(public_slug=slug).exclude(pk=self.pk).exists():
                slug = self.generate_public_slug()
            self.public_slug = slug
        super().save(*args, **kwargs)


import uuid
from django.utils import timezone
from datetime import timedelta

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'is_used']),
        ]

    @classmethod
    def generate_token(cls, user):
        token_str = uuid.uuid4().hex + uuid.uuid4().hex
        return cls.objects.create(user=user, token=token_str)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=30)


class LoginHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_history')
    device = models.CharField(max_length=120, blank=True, default='Unknown device')
    browser = models.CharField(max_length=120, blank=True, default='Unknown browser')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_active']),
        ]

    def __str__(self):
        return f"{self.user.username} login at {self.created_at:%Y-%m-%d %H:%M}"

