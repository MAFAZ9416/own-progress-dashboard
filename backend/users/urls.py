from django.urls import path

from .views import ProfileView, RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="user-register"),
    path("profile/", ProfileView.as_view(), name="user-profile"),
]
