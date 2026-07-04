from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.models import UserProfile
from skills.models import Skill
from tasks.models import Task

User = get_user_model()

class QuickActionInputSerializer(serializers.Serializer):
    ACTION_CHOICES = (
        ('backup', 'Database Backup'),
        ('report', 'System Report'),
        ('announcement', 'System Announcement'),
    )
    action_type = serializers.ChoiceField(choices=ACTION_CHOICES)


class AdminUserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['full_name', 'avatar', 'bio', 'country']


class AdminUserSerializer(serializers.ModelSerializer):
    profile = AdminUserProfileSerializer(read_only=True)
    role_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    joined_date = serializers.DateTimeField(source='date_joined', format='%Y-%m-%d %H:%M:%S', read_only=True)
    last_login = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'is_active', 'is_staff', 'is_superuser',
            'joined_date', 'last_login', 'profile', 'role_display', 'status_display'
        ]
        
    def get_role_display(self, obj):
        if obj.is_superuser:
            return "Super Admin"
        elif obj.is_staff:
            return "Staff"
        return "User"
        
    def get_status_display(self, obj):
        return "Active" if obj.is_active else "Inactive"


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='profile.full_name', required=False, allow_blank=True)
    bio = serializers.CharField(source='profile.bio', required=False, allow_blank=True)
    country = serializers.CharField(source='profile.country', required=False, allow_blank=True)
    avatar = serializers.ImageField(source='profile.avatar', required=False, allow_null=True)
    role = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'is_active', 'full_name', 'bio', 'country', 'avatar', 'role']
        
    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        role = validated_data.pop('role', None)
        
        # Check permissions for target superuser modification
        request_user = self.context.get('request').user
        if instance.is_superuser and not request_user.is_superuser:
            raise serializers.ValidationError("Only super admins can modify super admin accounts.")
            
        # Update main User fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        # Handle role modification
        if role is not None:
            # If changing role to superuser or staff, check rights
            if role == 'super_admin':
                if not request_user.is_superuser:
                    raise serializers.ValidationError("Only super admins can grant super admin permissions.")
                instance.is_staff = True
                instance.is_superuser = True
            elif role == 'staff':
                if instance.is_superuser and not request_user.is_superuser:
                    raise serializers.ValidationError("Cannot demote a super admin account.")
                instance.is_staff = True
                instance.is_superuser = False
            else:
                if instance.is_superuser and not request_user.is_superuser:
                    raise serializers.ValidationError("Cannot demote a super admin account.")
                instance.is_staff = False
                instance.is_superuser = False
                
        instance.save()
        
        # Update nested UserProfile
        profile = getattr(instance, 'profile', None)
        if not profile:
            profile = UserProfile.objects.create(user=instance)
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()
        
        return instance

