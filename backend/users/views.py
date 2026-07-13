from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import ProfileSerializer, RegisterSerializer, EmailTokenObtainPairSerializer, ChangePasswordSerializer, DeleteAccountSerializer, FeedbackSerializer, ForgotPasswordSerializer, ResetPasswordSerializer, LoginHistorySerializer
from threading import Thread
import logging

logger = logging.getLogger(__name__)


class RegisterView(generics.GenericAPIView):
    """Register a new user and return a clean JSON response."""

    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            from notifications.notification_service import create_notification
            try:
                create_notification(
                    user,
                    "Welcome to Progressly 🎉",
                    "Your workspace is ready. Start by adding a skill or task.",
                    "success",
                    metadata={
                        "source": "registration",
                    },
                )
            except Exception:
                logger.exception("Failed to create welcome notification.")
            
            # Send welcome email
            from .email_service import send_welcome_email
            try:
                full_name = getattr(user, 'profile', None) and user.profile.full_name or user.first_name or user.username
                Thread(
                    target=send_welcome_email,
                    args=(user.email, full_name),
                    daemon=True
                ).start()
            except Exception:
                logger.exception("Failed to start email thread.")

            response_data = {
                "message": "User registered successfully.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
            }
            return Response(response_data, status=status.HTTP_201_CREATED)
        
        print("REQUEST DATA:", request.data)
        print("SERIALIZER ERRORS:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.GenericAPIView):
    """Return profile details for the authenticated user."""

    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, *args, **kwargs):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, *args, **kwargs):
        from django.core.files.storage import default_storage

        # ── Upload diagnostic logging ──────────────────────────────────────
        logger.info("[ProfileView.PUT] User: %s", request.user.email)
        logger.info("[ProfileView.PUT] Content-Type: %s", request.content_type)
        logger.info("[ProfileView.PUT] request.FILES keys: %s", list(request.FILES.keys()))
        logger.info("[ProfileView.PUT] Storage backend: %s", default_storage.__class__.__name__)

        if 'avatar' in request.FILES:
            avatar_file = request.FILES['avatar']
            logger.info("[ProfileView.PUT] Avatar received: name=%s  size=%s  type=%s",
                        avatar_file.name, avatar_file.size, avatar_file.content_type)
        else:
            logger.info("[ProfileView.PUT] No avatar file in this request.")
        # ───────────────────────────────────────────────────────────────────

        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                serializer.save()
                logger.info("[ProfileView.PUT] Save successful. avatar value in DB: %s",
                            request.user.profile.avatar.name if hasattr(request.user, 'profile') and request.user.profile.avatar else 'None')
                logger.info("[ProfileView.PUT] avatar URL returned: %s",
                            serializer.data.get('avatar'))
            except Exception as exc:
                logger.exception("[ProfileView.PUT] UPLOAD FAILED: %s", exc)
                return Response({'detail': 'Image upload failed. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response(serializer.data, status=status.HTTP_200_OK)
        logger.warning("[ProfileView.PUT] Serializer errors: %s", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(generics.GenericAPIView):
    """View to change the password of the authenticated user."""

    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def put(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Password updated successfully."},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteAccountView(generics.GenericAPIView):
    """View to permanently delete the authenticated user account."""

    serializer_class = DeleteAccountSerializer
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            full_name = getattr(user, 'profile', None) and user.profile.full_name or user.first_name or user.username
            
            # Send deletion email BEFORE deleting
            from .email_service import send_account_deleted_email
            try:
                Thread(
                    target=send_account_deleted_email,
                    args=(user.email, full_name),
                    daemon=True,
                ).start()
            except Exception:
                logger.exception("Failed to start email thread.")

            user.delete()
            return Response(
                {"message": "Account deleted successfully."},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


class LoginHistoryView(generics.ListAPIView):
    """Return the login history records for the authenticated user with query filters."""
    serializer_class = LoginHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from .models import LoginHistory
        from django.db.models import Q
        
        queryset = LoginHistory.objects.filter(user=self.request.user).order_by('-created_at')
        
        search = self.request.query_params.get('search', '').strip()
        browser = self.request.query_params.get('browser', '').strip().lower()
        status_param = self.request.query_params.get('status', '').strip().lower()
        date_start = self.request.query_params.get('date_start', '').strip()
        date_end = self.request.query_params.get('date_end', '').strip()

        if search:
            queryset = queryset.filter(
                Q(ip_address__icontains=search) |
                Q(user_agent__icontains=search) |
                Q(os__icontains=search) |
                Q(device__icontains=search)
            )
        if browser and browser != 'all':
            queryset = queryset.filter(browser__icontains=browser)
        if status_param and status_param != 'all':
            is_active_val = (status_param == 'active')
            queryset = queryset.filter(is_active=is_active_val)
        if date_start:
            queryset = queryset.filter(created_at__date__gte=date_start)
        if date_end:
            queryset = queryset.filter(created_at__date__lte=date_end)
            
        # Return all filtered values, fallback to last 15 only if no parameters are passed
        if not (search or browser or status_param or date_start or date_end):
            return queryset[:15]
            
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FeedbackView(generics.GenericAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            name = serializer.validated_data.get("name", "")
            email = serializer.validated_data.get("email", "")
            message = serializer.validated_data.get("message", "")
            
            user_obj = request.user if request.user.is_authenticated else None
            if user_obj:
                try:
                    full_name = user_obj.profile.full_name or user_obj.username
                except Exception:
                    full_name = user_obj.username
                target_email = user_obj.email
            else:
                full_name = name or "Anonymous"
                target_email = email
            
            try:
                from admin_dashboard.models import AdminFeedback
                AdminFeedback.objects.create(
                    user=user_obj,
                    name=full_name,
                    comment=message
                )
            except Exception:
                logger.exception("Failed to store feedback in database.")

            # Trigger email sends
            from django.utils import timezone
            from .email_service import send_feedback_confirmation, send_admin_feedback, send_authenticated_feedback_thankyou
            
            date_str = timezone.now().strftime("%Y-%m-%d %H:%M:%S")
            feedback_type = request.data.get("type", "General Feedback")
            
            try:
                if target_email:
                    if user_obj:
                        Thread(
                            target=send_authenticated_feedback_thankyou,
                            args=(target_email, full_name, message),
                            daemon=True,
                        ).start()
                    else:
                        Thread(
                            target=send_feedback_confirmation,
                            args=(target_email, full_name, message),
                            daemon=True,
                        ).start()
                Thread(
                    target=send_admin_feedback,
                    args=(full_name, target_email, feedback_type, date_str, message),
                    daemon=True,
                ).start()
            except Exception:
                logger.exception("Failed to start email thread.")

            return Response(
                {"message": "Feedback sent successfully."},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordView(generics.GenericAPIView):
    serializer_class = ForgotPasswordSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.context.get('reset_user')
            if user:
                from .models import PasswordResetToken
                reset_token = PasswordResetToken.generate_token(user)
                
                from .email_service import send_password_reset_email
                try:
                    full_name = getattr(user, 'profile', None) and user.profile.full_name or user.first_name or user.username
                    Thread(
                        target=send_password_reset_email,
                        args=(user.email, full_name, reset_token.token),
                        daemon=True,
                    ).start()
                except Exception:
                    logger.exception("Failed to start email thread.")
            
            return Response(
                {"message": "If this email exists, reset instructions were sent."},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(generics.GenericAPIView):
    serializer_class = ResetPasswordSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            reset_token = serializer.context['reset_token']
            password = serializer.validated_data["password"]
            
            user = reset_token.user
            
            user.set_password(password)
            user.save()
            
            # Invalidate all unused tokens for this user
            reset_token.is_used = True
            reset_token.save()
            from .models import PasswordResetToken
            PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)
            
            # Send password reset success email
            from .email_service import send_password_changed_email
            try:
                full_name = getattr(user, 'profile', None) and user.profile.full_name or user.first_name or user.username
                Thread(
                    target=send_password_changed_email,
                    args=(user.email, full_name),
                    daemon=True,
                ).start()
            except Exception:
                logger.exception("Failed to start email thread.")
            
            return Response(
                {"message": "Password updated successfully."},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PublicProfileView(generics.GenericAPIView):
    """
    Public profile endpoint — no authentication required.
    Returns only publicly-safe data for a user identified by their public_slug.
    NEVER exposes: email, internal IDs, private tasks, login history, admin flags.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug, *args, **kwargs):
        from .models import UserProfile
        from skills.models import Skill
        from analytics.models import UserAchievement
        from django.db.models import Count, Q

        try:
            profile = UserProfile.objects.select_related('user').get(public_slug=slug)
        except UserProfile.DoesNotExist:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = profile.user

        # Avatar URL
        avatar_url = None
        if profile.avatar:
            avatar_str = str(profile.avatar)
            if avatar_str.startswith('http'):
                avatar_url = avatar_str
            elif hasattr(profile.avatar, 'url'):
                try:
                    avatar_url = request.build_absolute_uri(profile.avatar.url)
                except Exception:
                    avatar_url = None

        # Skills — name, progress, color only (no IDs exposed)
        skills_qs = Skill.objects.filter(user=user).annotate(
            done=Count('tasks', filter=Q(tasks__status='completed'))
        ).values('name', 'target_tasks', 'color', 'done')

        skills_data = []
        for s in skills_qs:
            target = s['target_tasks'] or 1
            progress = min(round((s['done'] / target) * 100), 100)
            skills_data.append({
                'name': s['name'],
                'progress': progress,
                'color': s['color'] or '#6366f1',
            })

        # Unlocked achievements only
        achievements_data = [
            {
                'name': ua.achievement.name,
                'icon': ua.achievement.icon,
                'description': ua.achievement.description,
                'unlocked_at': ua.unlocked_at,
            }
            for ua in UserAchievement.objects.filter(user=user).select_related('achievement').order_by('-unlocked_at')
        ]

        # Stats — counts only, no private details
        from tasks.models import Task
        total_tasks = Task.objects.filter(user=user).count()
        completed_tasks = Task.objects.filter(user=user, status='completed').count()
        total_skills = Skill.objects.filter(user=user).count()

        data = {
            'name': profile.full_name or user.username.split('@')[0],
            'bio': profile.bio or '',
            'country': profile.country or '',
            'avatar': avatar_url,
            'public_slug': profile.public_slug,
            'member_since': user.date_joined.strftime('%B %Y'),
            'skills': skills_data,
            'achievements': achievements_data,
            'stats': {
                'total_skills': total_skills,
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'achievements_unlocked': len(achievements_data),
            },
        }

        return Response(data, status=status.HTTP_200_OK)


class GoogleLoginView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        # We expect a POST request with the 'credential' token (Google ID Token)
        token = request.data.get('token') or request.data.get('credential')
        if not token:
            return Response(
                {"error": "Google credential token is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Verify Google token ──
        # Read client ID from settings or environment
        from django.conf import settings
        from django.contrib.auth import get_user_model
        from rest_framework_simplejwt.tokens import RefreshToken

        User = get_user_model()
        google_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
        if not google_client_id:
            import os
            google_client_id = os.environ.get('GOOGLE_CLIENT_ID')

        idinfo = None
        # Try verifying with google-auth library first since we installed it successfully
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), google_client_id)
        except Exception as e:
            logger.warning(f"google-auth verification failed: {e}. Falling back to tokeninfo endpoint.")

        # Fallback to direct tokeninfo HTTP request to support local testing or if client_id mismatch
        if not idinfo:
            try:
                import requests as py_requests
                resp = py_requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}", timeout=10)
                if resp.status_code == 200:
                    idinfo = resp.json()
                    # Double check audience/client ID matches if configured
                    if google_client_id and idinfo.get('aud') != google_client_id:
                        logger.warning(f"Audience mismatch: {idinfo.get('aud')} != {google_client_id}")
                else:
                    return Response(
                        {"error": "Invalid Google credential token."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception as e:
                logger.exception("Failed to verify Google token via HTTP request.")
                return Response(
                    {"error": "Google auth service unavailable."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

        if not idinfo:
            return Response(
                {"error": "Could not verify Google credential."},
                status=status.HTTP_400_BAD_REQUEST
            )

        email = idinfo.get('email')
        name = idinfo.get('name') or idinfo.get('given_name', '')
        picture = idinfo.get('picture')

        if not email:
            return Response(
                {"error": "Google account must have an email address."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Lookup or Create User ──
        # Check if email is already in use
        user = User.objects.filter(email__iexact=email).first()

        if not user:
            # Create user safely
            import random, string
            username = email
            # Generate long random password
            password = ''.join(random.choices(string.ascii_letters + string.digits, k=30))
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            # Create welcome notification
            from notifications.notification_service import create_notification
            try:
                create_notification(
                    user,
                    "Welcome to Progressly 🎉",
                    "Your workspace is ready. Start by adding a skill or task.",
                    "success",
                    metadata={"source": "google_registration"},
                )
            except Exception:
                logger.exception("Failed to create welcome notification.")
            
            # Send welcome email
            from .email_service import send_welcome_email
            try:
                Thread(
                    target=send_welcome_email,
                    args=(user.email, name or username),
                    daemon=True
                ).start()
            except Exception:
                logger.exception("Failed to start email thread.")

        # Update profile properties (fullname / avatar) if needed
        profile = user.profile
        if not profile.full_name and name:
            profile.full_name = name

        # Download avatar if profile doesn't have one and google profile picture exists
        if not profile.avatar and picture:
            from django.core.files.base import ContentFile
            import urllib.request
            try:
                headers = {'User-Agent': 'Mozilla/5.0'}
                req = urllib.request.Request(picture, headers=headers)
                with urllib.request.urlopen(req, timeout=5) as resp:
                    profile.avatar.save(f"avatar_{user.id}.jpg", ContentFile(resp.read()), save=False)
            except Exception:
                logger.warning("Failed to download Google avatar.")

        profile.save()

        # ── Record login history ──
        try:
            user_agent_str = request.META.get('HTTP_USER_AGENT', '')
            ip = (
                request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
                or request.META.get('REMOTE_ADDR', '')
            )
            ua_lower = user_agent_str.lower()
            if 'chrome' in ua_lower and 'edg' not in ua_lower:
                browser = 'Chrome'
            elif 'firefox' in ua_lower:
                browser = 'Firefox'
            elif 'safari' in ua_lower and 'chrome' not in ua_lower:
                browser = 'Safari'
            else:
                browser = 'Unknown Browser'

            if 'windows' in ua_lower:
                device = 'Windows'
            elif 'mac' in ua_lower:
                device = 'Mac'
            else:
                device = 'Mobile/Other'

            from .models import LoginHistory
            LoginHistory.objects.create(
                user=user,
                device=device,
                browser=browser,
                ip_address=ip or None,
                user_agent=user_agent_str[:500],
            )
        except Exception:
            pass

        # ── Generate tokens ──
        refresh = RefreshToken.for_user(user)

        # Avatar absolute URI
        avatar_uri = None
        if profile.avatar:
            try:
                avatar_uri = request.build_absolute_uri(profile.avatar.url)
            except Exception:
                avatar_uri = None

        response_data = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'full_name': profile.full_name,
                'avatar': avatar_uri,
                'public_slug': profile.public_slug,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
            }
        }

        return Response(response_data, status=status.HTTP_200_OK)

