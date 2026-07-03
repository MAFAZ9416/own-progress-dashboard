from rest_framework.permissions import BasePermission

class IsAdminUser(BasePermission):
    """
    Custom permission to check that the user is authenticated and is an admin
    (either is_staff = True or is_superuser = True).
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_staff or request.user.is_superuser)
        )
