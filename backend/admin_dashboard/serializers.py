from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from users.models import UserProfile
from skills.models import Skill
from tasks.models import Task

User = get_user_model()

class QuickActionInputSerializer(serializers.Serializer):
    ACTION_CHOICES = (
        ('backup', 'Database Backup'),
        ('report', 'System Report'),
        ('announcement', 'System Announcement'),
        ('export', 'Export Dashboard Data'),
    )
    action_type = serializers.ChoiceField(choices=ACTION_CHOICES)



class AdminUserProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['full_name', 'avatar', 'bio', 'country']

    def get_avatar(self, obj):
        if not obj.avatar:
            return None
        url = obj.avatar.url
        if url.startswith('http://') or url.startswith('https://'):
            return url
        request = self.context.get('request')
        if request is not None:
            return request.build_absolute_uri(url)
        from django.conf import settings
        site_url = getattr(settings, 'SITE_URL', 'http://127.0.0.1:8000')
        return f"{site_url.rstrip('/')}{url}"


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
    full_name = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField(required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
    role = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'is_active', 'full_name', 'bio', 'country', 'avatar', 'role']
        
    def update(self, instance, validated_data):
        full_name = validated_data.pop('full_name', None)
        bio = validated_data.pop('bio', None)
        country = validated_data.pop('country', None)
        avatar = validated_data.pop('avatar', None)
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
            
        if full_name is not None:
            profile.full_name = full_name
        if bio is not None:
            profile.bio = bio
        if country is not None:
            profile.country = country
        if avatar is not None:
            profile.avatar = avatar
        profile.save()
        
        return instance


class AdminSkillGlobalUpdateSerializer(serializers.Serializer):
    old_name = serializers.CharField(max_length=100)
    new_name = serializers.CharField(max_length=100)
    color = serializers.CharField(max_length=7, default='#3B82F6')


class AdminSkillCreateSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    name = serializers.CharField(max_length=100)
    color = serializers.CharField(max_length=7, required=False, default='#3B82F6')
    target_tasks = serializers.IntegerField(default=10, min_value=1)


class AdminUserCreateSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(max_length=100, required=True)
    password = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})
    password_confirm = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})
    bio = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    country = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'full_name', 'bio', 'country', 'avatar']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        
        try:
            validate_password(attrs.get('password'))
        except ValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        return attrs

    def create(self, validated_data):
        email = validated_data.get('email')
        password = validated_data.get('password')
        full_name = validated_data.get('full_name')
        bio = validated_data.get('bio', '')
        country = validated_data.get('country', '')
        avatar = validated_data.get('avatar', None)

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password
        )

        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.full_name = full_name
        if bio:
            profile.bio = bio
        if country:
            profile.country = country
        if avatar:
            profile.avatar = avatar
        profile.save()

        # Update cache in memory so serializing user returns populated profile
        user.profile = profile

        return user


class AdminUserPasswordChangeSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})
    confirm_password = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})

    def validate(self, attrs):
        if attrs.get('new_password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        
        try:
            validate_password(attrs.get('new_password'))
        except ValidationError as e:
            raise serializers.ValidationError({"new_password": list(e.messages)})
        return attrs


class AdminTaskSerializer(serializers.ModelSerializer):
    owner = serializers.SerializerMethodField()
    skill = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'status', 'priority', 'created_at', 'owner', 'skill']

    def get_owner(self, obj):
        user = obj.user
        full_name = getattr(user, 'username', 'Unknown')
        try:
            if hasattr(user, 'profile') and user.profile:
                full_name = user.profile.full_name or user.username
        except Exception:
            pass
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': full_name
        }

    def get_skill(self, obj):
        skill = obj.skill
        if not skill:
            return None
        return {
            'id': skill.id,
            'name': skill.name,
            'color': skill.color
        }


from analytics.models import Achievement

class AdminAchievementSerializer(serializers.ModelSerializer):
    unlocked_count = serializers.SerializerMethodField()

    class Meta:
        model = Achievement
        fields = ['id', 'name', 'description', 'icon', 'condition', 'is_active', 'created_at', 'unlocked_count']

    def get_unlocked_count(self, obj):
        return obj.user_unlocks.count()


from .models import AdminNotification

class AdminNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminNotification
        fields = ['id', 'title', 'message', 'level', 'created_at']


from .models import AdminFeedback

class AdminFeedbackSerializer(serializers.ModelSerializer):
    user_username = serializers.SerializerMethodField()

    class Meta:
        model = AdminFeedback
        fields = ['id', 'user', 'user_username', 'name', 'email', 'subject', 'avatar_url', 'rating', 'comment', 'status', 'created_at']

    def get_user_username(self, obj):
        return obj.user.username if obj.user else None





