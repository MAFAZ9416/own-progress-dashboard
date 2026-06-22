from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .serializers import ProfileSerializer, RegisterSerializer


class RegisterView(generics.GenericAPIView):
    """Register a new user and return a clean JSON response."""

    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
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

    def get(self, request, *args, **kwargs):
        serializer = self.get_serializer(request.user)
        return Response({"profile": serializer.data}, status=status.HTTP_200_OK)
