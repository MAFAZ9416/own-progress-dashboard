from django.urls import path

from .views import ProfileView, RegisterView, ChangePasswordView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="user-register"),
    path("profile/", ProfileView.as_view(), name="user-profile"),
    path("change-password/", ChangePasswordView.as_view(), name="user-change-password"),
]
