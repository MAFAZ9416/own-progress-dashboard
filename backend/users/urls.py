from django.urls import path

from .views import ProfileView, RegisterView, ChangePasswordView, DeleteAccountView, FeedbackView, ForgotPasswordView, ResetPasswordView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="user-register"),
    path("profile/", ProfileView.as_view(), name="user-profile"),
    path("change-password/", ChangePasswordView.as_view(), name="user-change-password"),
    path("delete-account/", DeleteAccountView.as_view(), name="user-delete-account"),
    path("feedback/", FeedbackView.as_view(), name="user-feedback"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="user-forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="user-reset-password"),
]

