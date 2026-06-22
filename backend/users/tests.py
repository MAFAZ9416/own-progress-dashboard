from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import UserProfile
from io import BytesIO
from PIL import Image

User = get_user_model()


class UserProfileTests(APITestCase):
    def setUp(self):
        self.register_url = reverse("user-register")
        self.profile_url = reverse("user-profile")
        
        # Create a test user
        self.user_data = {
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "TestPassword123!",
            "password2": "TestPassword123!"
        }
        self.user = User.objects.create_user(
            username="existinguser",
            email="existing@example.com",
            password="ExistingPassword123!"
        )
        
        # Authenticate test client
        self.client.force_authenticate(user=self.user)

    def test_registration_creates_profile(self):
        """Verify that registering a new user creates a UserProfile via signal."""
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        new_user = User.objects.get(username="testuser")
        self.assertTrue(UserProfile.objects.filter(user=new_user).exists())
        profile = new_user.profile
        self.assertFalse(profile.avatar)

    def test_get_profile(self):
        """Verify that an authenticated user can fetch their profile."""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "existinguser")
        self.assertEqual(response.data["email"], "existing@example.com")
        self.assertEqual(response.data["bio"], "")
        self.assertIsNone(response.data["avatar"])

    def test_update_profile(self):
        """Verify updating basic user profile details (username, email, bio)."""
        update_data = {
            "username": "updatedusername",
            "email": "updatedemail@example.com",
            "bio": "Software developer specialized in backend."
        }
        response = self.client.put(self.profile_url, update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "updatedusername")
        self.assertEqual(response.data["email"], "updatedemail@example.com")
        self.assertEqual(response.data["bio"], "Software developer specialized in backend.")
        
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "updatedusername")
        self.assertEqual(self.user.email, "updatedemail@example.com")
        self.assertEqual(self.user.profile.bio, "Software developer specialized in backend.")

    def test_username_required(self):
        """Verify username cannot be set to empty."""
        update_data = {
            "username": "",
            "email": "another@example.com"
        }
        response = self.client.put(self.profile_url, update_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_email_uniqueness(self):
        """Verify that an email already in use cannot be claimed by another user."""
        # Create second user
        other_user = User.objects.create_user(
            username="otheruser",
            email="otheruser@example.com",
            password="OtherPassword123!"
        )
        
        update_data = {
            "username": "existinguser",
            "email": "otheruser@example.com"
        }
        response = self.client.put(self.profile_url, update_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_bio_max_length(self):
        """Verify bio cannot exceed 150 characters."""
        long_bio = "a" * 151
        update_data = {
            "username": "existinguser",
            "email": "existing@example.com",
            "bio": long_bio
        }
        response = self.client.put(self.profile_url, update_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("bio", response.data)

    def test_avatar_successful_upload(self):
        """Verify that uploading a valid avatar succeeds and returns the media path."""
        # Create a small valid PNG image in memory using Pillow
        file_obj = BytesIO()
        image = Image.new("RGB", (100, 100), color="red")
        image.save(file_obj, format="PNG")
        file_obj.seek(0)
        avatar_file = SimpleUploadedFile("avatar.png", file_obj.read(), content_type="image/png")
        update_data = {
            "username": "existinguser",
            "email": "existing@example.com",
            "avatar": avatar_file
        }
        response = self.client.put(self.profile_url, update_data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("avatar", response.data["avatar"])
        self.assertTrue(response.data["avatar"].lower().endswith((".png", ".jpg", ".jpeg", ".webp")))

        self.user.refresh_from_db()
        self.assertIn("avatar", self.user.profile.avatar.name)

    def test_avatar_validation_type(self):
        """Verify that only allowed image types (JPG, PNG, WEBP) are accepted."""
        invalid_file = SimpleUploadedFile("avatar.txt", b"dummy content", content_type="text/plain")
        response = self.client.put(self.profile_url, {"avatar": invalid_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("avatar", response.data)

    def test_avatar_validation_size(self):
        """Verify that avatars cannot exceed 5MB."""
        large_file = SimpleUploadedFile(
            "avatar.png",
            b"a" * (6 * 1024 * 1024),
            content_type="image/png"
        )
        response = self.client.put(self.profile_url, {"avatar": large_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("avatar", response.data)
