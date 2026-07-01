from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from users.models import UserProfile
from skills.models import Skill
from tasks.models import Task
from admin_panel.models import Feedback, EmailLog, SystemSetting, AdminNotification, BackupLog, UserLoginHistory, ActivityLog

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['full_name', 'avatar', 'bio']

class AdminUserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    skills_count = serializers.SerializerMethodField()
    tasks_count = serializers.SerializerMethodField()
    completed_tasks_count = serializers.SerializerMethodField()
    current_streak = serializers.SerializerMethodField()
    longest_streak = serializers.SerializerMethodField()
    last_activity = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_active', 'is_staff', 'is_superuser', 'date_joined',
            'profile', 'skills_count', 'tasks_count', 'completed_tasks_count',
            'current_streak', 'longest_streak', 'last_activity'
        ]

    def get_skills_count(self, obj):
        return obj.skills.count()

    def get_tasks_count(self, obj):
        return obj.tasks.count()

    def get_completed_tasks_count(self, obj):
        return obj.tasks.filter(status='completed').count()

    def get_current_streak(self, obj):
        return getattr(getattr(obj, 'streak', None), 'current_streak', 0)

    def get_longest_streak(self, obj):
        return getattr(getattr(obj, 'streak', None), 'longest_streak', 0)

    def get_last_activity(self, obj):
        last_log = obj.login_history.order_by('-last_activity').first()
        return last_log.last_activity if last_log else None

class AdminSkillSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Skill
        fields = ['id', 'user', 'user_email', 'name', 'color', 'target_tasks', 'progress', 'created_at', 'updated_at']

    def get_progress(self, obj):
        completed = obj.tasks.filter(status="completed").count()
        if not obj.target_tasks:
            return 0
        return min(round((completed / obj.target_tasks) * 100, 2), 100)

class AdminTaskSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    skill_name = serializers.CharField(source='skill.name', read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'user', 'user_email', 'skill', 'skill_name', 'title', 'description', 'status', 'created_at', 'updated_at']

class FeedbackSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = Feedback
        fields = ['id', 'user', 'user_email', 'name', 'email', 'feedback_type', 'message', 'status', 'reply', 'created_at', 'updated_at']

    def get_user_email(self, obj):
        return obj.user.email if obj.user else obj.email

class EmailLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailLog
        fields = ['id', 'recipient', 'subject', 'template_name', 'status', 'error_message', 'created_at']

class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = ['id', 'key', 'value', 'description', 'category', 'updated_at']

class AdminNotificationSerializer(serializers.ModelSerializer):
    recipient_email = serializers.EmailField(source='recipient.email', read_only=True, allow_null=True)

    class Meta:
        model = AdminNotification
        fields = ['id', 'title', 'message', 'recipient', 'recipient_email', 'scheduled_for', 'is_sent', 'created_at']

class BackupLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = BackupLog
        fields = ['id', 'filename', 'size_bytes', 'status', 'error_message', 'created_at']

class UserLoginHistorySerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = UserLoginHistory
        fields = ['id', 'user', 'user_email', 'ip_address', 'user_agent', 'login_time', 'last_activity', 'is_active_session']

class ActivityLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'actor', 'actor_email', 'action', 'details', 'severity', 'ip_address', 'user_agent', 'created_at']

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'content_type']

class GroupSerializer(serializers.ModelSerializer):
    permissions_list = PermissionSerializer(source='permissions', many=True, read_only=True)
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions', 'permissions_list', 'user_count']

    def get_user_count(self, obj):
        return obj.user_set.count()
