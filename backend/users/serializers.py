from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serialize basic user details for responses."""

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "date_joined",
        ]
        read_only_fields = ["id", "is_active", "date_joined"]


class RegisterSerializer(serializers.ModelSerializer):
    """Validate registration input and create a new user."""

    password = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})
    password2 = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "password2",
        ]
        extra_kwargs = {
            "email": {"required": True},
            "first_name": {"required": False},
            "last_name": {"required": False},
        }

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password2"):
            raise serializers.ValidationError({"password": "Password fields didn’t match."})

        validate_password(attrs.get("password"))
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2", None)
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ProfileSerializer(serializers.ModelSerializer):
    """Serialize profile information for the authenticated user."""
    bio = serializers.CharField(source='profile.bio', max_length=150, allow_blank=True, required=False)
    avatar = serializers.ImageField(source='profile.avatar', required=False, allow_null=True)
    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=True)
    date_joined = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "bio",
            "avatar",
            "date_joined",
        ]

    def validate_email(self, value):
        user = self.context['request'].user
        if User.objects.exclude(pk=user.pk).filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value

    def validate_avatar(self, value):
        if value:
            # 5 MB limit
            if hasattr(value, 'size') and value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Image size cannot exceed 5MB.")
            
            # Extension check
            import os
            ext = os.path.splitext(value.name)[1].lower() if hasattr(value, 'name') and value.name else ''
            valid_extensions = ['.jpg', '.jpeg', '.png', '.webp']
            if ext not in valid_extensions:
                raise serializers.ValidationError("Only JPG, JPEG, PNG and WEBP images are allowed.")
            
            # Simple content type check
            if hasattr(value, 'content_type'):
                valid_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
                if value.content_type not in valid_types:
                    raise serializers.ValidationError("Only JPG, JPEG, PNG and WEBP images are allowed.")
        return value

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {}) or {}
        
        # Update User model fields
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.save()

        # Update UserProfile model fields
        from .models import UserProfile
        profile, created = UserProfile.objects.get_or_create(user=instance)
        if 'bio' in profile_data:
            profile.bio = profile_data['bio']
        if 'avatar' in profile_data:
            profile.avatar = profile_data['avatar']
        profile.save()

        # Refresh instance from database to clear cached relations
        instance.refresh_from_db()

        return instance
