from django.conf import settings
from django.db import models


class Achievement(models.Model):
	name = models.CharField(max_length=120, unique=True)
	description = models.TextField()
	icon = models.CharField(max_length=32, default='🏆')
	condition = models.CharField(max_length=255)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return self.name


class UserAchievement(models.Model):
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_achievements')
	achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name='user_unlocks')
	unlocked_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		unique_together = ('user', 'achievement')
		indexes = [models.Index(fields=['user', '-unlocked_at'])]

	def __str__(self):
		return f"{self.user_id} - {self.achievement.name}"


class Activity(models.Model):
	ACTION_TYPES = (
		('task_created', 'Task Created'),
		('task_reopened', 'Task Reopened'),
		('skill_created', 'Skill Created'),
		('task_completed', 'Task Completed'),
		('achievement_unlocked', 'Achievement Unlocked'),
		('streak_updated', 'Streak Updated'),
	)

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activities')
	action_type = models.CharField(max_length=32, choices=ACTION_TYPES)
	message = models.CharField(max_length=255)
	metadata = models.JSONField(default=dict, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at']
		indexes = [models.Index(fields=['user', '-created_at']), models.Index(fields=['user', 'action_type'])]

	def __str__(self):
		return f"{self.user_id} {self.action_type}"
