from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User
from streaks.models import Streak


@receiver(post_save, sender=User)
def create_user_streak(sender, instance, created, **kwargs):
    if created:
        Streak.objects.create(user=instance)