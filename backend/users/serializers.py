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
    notifications_enabled = serializers.BooleanField(source='profile.notifications_enabled', required=False)
    preferences = serializers.JSONField(source='profile.preferences', required=False)
    public_slug = serializers.CharField(source='profile.public_slug', read_only=True)
    email = serializers.EmailField(required=True)
    date_joined = serializers.DateTimeField(read_only=True, format="%Y-%m-%d")

    class Meta:
        model = User
        fields = [
            "id",
            "full_name",
            "email",
            "bio",
            "avatar",
            "notifications_enabled",
            "preferences",
            "date_joined",
            "public_slug",
            "is_staff",
            "is_superuser",
        ]
        read_only_fields = ["id", "public_slug", "is_staff", "is_superuser"]


    def to_representation(self, instance):
        ret = super().to_representation(instance)
        avatar_val = ret.get('avatar')
        if avatar_val and not avatar_val.startswith('http'):
            request = self.context.get('request')
            if request is not None:
                ret['avatar'] = request.build_absolute_uri(avatar_val)
            else:
                from django.conf import settings
                site_url = getattr(settings, 'SITE_URL', 'http://127.0.0.1:8000')
                ret['avatar'] = f"{site_url.rstrip('/')}{avatar_val}"
        return ret

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
        if 'notifications_enabled' in profile_data:
            profile.notifications_enabled = profile_data['notifications_enabled']
        if 'preferences' in profile_data:
            profile.preferences = profile_data['preferences']
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


class DeleteAccountSerializer(serializers.Serializer):
    confirm_text = serializers.CharField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"}
    )

    def validate_confirm_text(self, value):
        if value != "DELETE":
            raise serializers.ValidationError("You must type DELETE to confirm.")
        return value

    def validate(self, attrs):
        password = attrs.get("password")
        user = self.context['request'].user

        if not user.check_password(password):
            raise serializers.ValidationError({"password": "Incorrect password."})

        return attrs


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if not email or not password:
            raise serializers.ValidationError("Must include 'email' and 'password'.")

        authenticated_user = authenticate(
            request=self.context.get('request'),
            username=email,
            password=password
        )

        if not authenticated_user or not authenticated_user.is_active:
            raise serializers.ValidationError("No active account found with the given credentials")

        self.user = authenticated_user

        refresh = self.get_token(self.user)

        data = {}
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)

        # Record login history
        try:
            request = self.context.get('request')
            if request:
                user_agent_str = request.META.get('HTTP_USER_AGENT', '')
                ip = (
                    request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
                    or request.META.get('REMOTE_ADDR', '')
                )
                # Simple UA parsing
                ua_lower = user_agent_str.lower()
                if 'chrome' in ua_lower and 'edg' not in ua_lower:
                    browser = 'Chrome'
                elif 'firefox' in ua_lower:
                    browser = 'Firefox'
                elif 'safari' in ua_lower and 'chrome' not in ua_lower:
                    browser = 'Safari'
                elif 'edg' in ua_lower:
                    browser = 'Edge'
                elif 'opera' in ua_lower or 'opr' in ua_lower:
                    browser = 'Opera'
                else:
                    browser = 'Unknown Browser'

                if 'windows' in ua_lower:
                    device = 'Windows'
                elif 'macintosh' in ua_lower or 'mac os' in ua_lower:
                    device = 'Mac'
                elif 'iphone' in ua_lower:
                    device = 'iPhone'
                elif 'ipad' in ua_lower:
                    device = 'iPad'
                elif 'android' in ua_lower:
                    device = 'Android'
                elif 'linux' in ua_lower:
                    device = 'Linux'
                else:
                    device = 'Unknown Device'

                from .models import LoginHistory
                LoginHistory.objects.create(
                    user=self.user,
                    device=device,
                    browser=browser,
                    ip_address=ip or None,
                    user_agent=user_agent_str[:500],
                )
        except Exception:
            pass  # Never block login due to history logging errors

        return data


class FeedbackSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    email = serializers.EmailField(required=False, allow_blank=True)
    message = serializers.CharField(required=True)

    def validate(self, attrs):
        message = attrs.get("message", "")
        if len(message) < 10:
            raise serializers.ValidationError(
                {
                    "message":
                    "Please enter at least 10 characters."
                }
            )
        return attrs


from .models import PasswordResetToken

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        try:
            user = User.objects.select_related('profile').get(email__iexact=value)
            self.context['reset_user'] = user
        except User.DoesNotExist:
            self.context['reset_user'] = None
        return value


class LoginHistorySerializer(serializers.ModelSerializer):
    """Serialize LoginHistory records for the security panel."""
    os = serializers.SerializerMethodField()

    class Meta:
        from .models import LoginHistory
        model = LoginHistory
        fields = ['id', 'device', 'browser', 'os', 'ip_address', 'created_at', 'is_active']
        read_only_fields = fields

    def get_os(self, obj):
        ua = (obj.user_agent or '').lower()
        if 'windows' in ua:
            return 'Windows'
        elif 'macintosh' in ua or 'mac os' in ua:
            return 'Mac OS'
        elif 'linux' in ua:
            return 'Linux'
        elif 'android' in ua:
            return 'Android'
        elif 'iphone' in ua or 'ipad' in ua:
            return 'iOS'
        return 'Unknown OS'


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})
    confirm_password = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})

    def validate_token(self, value):
        try:
            reset_token = PasswordResetToken.objects.select_related('user', 'user__profile').get(token=value)
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError("Invalid token.")

        if reset_token.is_used:
            raise serializers.ValidationError("This token has already been used.")

        if reset_token.is_expired():
            raise serializers.ValidationError("This token has expired.")

        self.context['reset_token'] = reset_token
        return value

    def validate(self, attrs):
        password = attrs.get("password")
        confirm_password = attrs.get("confirm_password")

        if password != confirm_password:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        try:
            validate_password(password)
        except Exception as e:
            from django.core.exceptions import ValidationError as DjangoValidationError
            if isinstance(e, DjangoValidationError):
                raise serializers.ValidationError({"password": list(e.messages)})
            raise serializers.ValidationError({"password": str(e)})

        return attrs


