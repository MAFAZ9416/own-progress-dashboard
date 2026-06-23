from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

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

    full_name = serializers.CharField(max_length=100)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})
    password2 = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = [
            "full_name",
            "email",
            "password",
            "password2",
        ]

    def validate(self, attrs):
        email = attrs.get("email")
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({
                "email": "Email already exists."
            })

        if attrs.get("password") != attrs.get("password2"):
            raise serializers.ValidationError({"password": "Password fields didn’t match."})

        validate_password(attrs.get("password"))
        return attrs

    def create(self, validated_data):
        full_name = validated_data.pop("full_name", "")
        email = validated_data.get("email")
        password = validated_data.get("password")

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password
        )
        
        profile = user.profile
        profile.full_name = full_name
        profile.save()

        return user


class ProfileSerializer(serializers.ModelSerializer):
    """Serialize profile information for the authenticated user."""
    full_name = serializers.CharField(source='profile.full_name', max_length=100, allow_blank=True, required=False)
    bio = serializers.CharField(source='profile.bio', max_length=150, allow_blank=True, required=False)
    avatar = serializers.ImageField(source='profile.avatar', required=False, allow_null=True)
    email = serializers.EmailField(required=True)
    date_joined = serializers.DateTimeField(read_only=True, format="%Y-%m-%d")

    class Meta:
        model = User
        fields = [
            "full_name",
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
        email = validated_data.get('email')
        if email:
            instance.email = email
            instance.username = email
        instance.save()

        # Update UserProfile model fields
        from .models import UserProfile
        profile, created = UserProfile.objects.get_or_create(user=instance)
        if 'full_name' in profile_data:
            profile.full_name = profile_data['full_name']
        if 'bio' in profile_data:
            profile.bio = profile_data['bio']
        if 'avatar' in profile_data:
            profile.avatar = profile_data['avatar']
        profile.save()

        # Refresh instance from database to clear cached relations
        instance.refresh_from_db()

        return instance


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"}
    )
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"}
    )

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Incorrect password.")
        return value

    def validate(self, attrs):
        current_password = attrs.get("current_password")
        new_password = attrs.get("new_password")
        confirm_password = attrs.get("confirm_password")

        # New password and confirm password must match.
        if new_password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        # New password must not equal current password.
        if new_password == current_password:
            raise serializers.ValidationError({
                "new_password": "New password cannot be the same as the current password."
            })

        # Password length minimum: 8 characters
        if len(new_password) < 8:
            raise serializers.ValidationError({
                "new_password": "Password must be at least 8 characters."
            })

        # Use Django password validators
        user = self.context['request'].user
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as e:
            raise serializers.ValidationError({
                "new_password": list(e.messages)
            })

        return attrs

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if not email or not password:
            raise serializers.ValidationError("Must include 'email' and 'password'.")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("No active account found with the given credentials")

        authenticated_user = authenticate(
            request=self.context.get('request'),
            username=user.username,
            password=password
        )

        if not authenticated_user or not authenticated_user.is_active:
            raise serializers.ValidationError("No active account found with the given credentials")

        self.user = authenticated_user

        refresh = self.get_token(self.user)

        data = {}
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)

        return data
