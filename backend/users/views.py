from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import ProfileSerializer, RegisterSerializer, EmailTokenObtainPairSerializer, ChangePasswordSerializer, DeleteAccountSerializer, FeedbackSerializer, ForgotPasswordSerializer, ResetPasswordSerializer
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
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
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


class FeedbackView(generics.GenericAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            name = serializer.validated_data.get("name", "")
            email = serializer.validated_data.get("email", "")
            message = serializer.validated_data.get("message", "")

            # Trigger email sends
            from django.utils import timezone
            from .email_service import send_feedback_confirmation, send_admin_feedback
            
            date_str = timezone.now().strftime("%Y-%m-%d %H:%M:%S")
            feedback_type = request.data.get("type", "General Feedback")
            
            try:
                if email:
                    Thread(
                        target=send_feedback_confirmation,
                        args=(email, name),
                        daemon=True,
                    ).start()
                Thread(
                    target=send_admin_feedback,
                    args=(name, email, feedback_type, date_str, message),
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
            email = serializer.validated_data["email"]
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(email__iexact=email)
            
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
                {"message": "Reset link sent."},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(generics.GenericAPIView):
    serializer_class = ResetPasswordSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            token_val = serializer.validated_data["token"]
            password = serializer.validated_data["password"]
            
            from .models import PasswordResetToken
            reset_token = PasswordResetToken.objects.get(token=token_val)
            user = reset_token.user
            
            user.set_password(password)
            user.save()
            
            # Invalidate all unused tokens for this user
            reset_token.is_used = True
            reset_token.save()
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

