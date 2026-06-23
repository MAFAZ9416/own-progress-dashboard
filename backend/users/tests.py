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
            "full_name": "Test User",
            "email": "testuser@example.com",
            "password": "TestPassword123!",
            "password2": "TestPassword123!"
        }
        self.user = User.objects.create_user(
            username="existing@example.com",
            email="existing@example.com",
            password="ExistingPassword123!"
        )
        self.user.profile.full_name = "Existing User"
        self.user.profile.save()
        
        # Authenticate test client
        self.client.force_authenticate(user=self.user)

    def test_registration_creates_profile(self):
        """Verify that registering a new user creates a UserProfile via signal."""
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        new_user = User.objects.get(email="testuser@example.com")
        self.assertTrue(UserProfile.objects.filter(user=new_user).exists())
        profile = new_user.profile
        self.assertEqual(profile.full_name, "Test User")
        self.assertFalse(profile.avatar)

    def test_get_profile(self):
        """Verify that an authenticated user can fetch their profile."""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["full_name"], "Existing User")
        self.assertEqual(response.data["email"], "existing@example.com")
        self.assertEqual(response.data["bio"], "")
        self.assertIsNone(response.data["avatar"])

    def test_update_profile(self):
        """Verify updating basic user profile details (full_name, email, bio)."""
        update_data = {
            "full_name": "Updated User Name",
            "email": "updatedemail@example.com",
            "bio": "Software developer specialized in backend."
        }
        response = self.client.put(self.profile_url, update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["full_name"], "Updated User Name")
        self.assertEqual(response.data["email"], "updatedemail@example.com")
        self.assertEqual(response.data["bio"], "Software developer specialized in backend.")
        
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "updatedemail@example.com")
        self.assertEqual(self.user.email, "updatedemail@example.com")
        self.assertEqual(self.user.profile.full_name, "Updated User Name")
        self.assertEqual(self.user.profile.bio, "Software developer specialized in backend.")

    def test_email_uniqueness(self):
        """Verify that an email already in use cannot be claimed by another user."""
        # Create second user
        other_user = User.objects.create_user(
            username="otheruser@example.com",
            email="otheruser@example.com",
            password="OtherPassword123!"
        )
        
        update_data = {
            "full_name": "Existing User",
            "email": "otheruser@example.com"
        }
        response = self.client.put(self.profile_url, update_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_bio_max_length(self):
        """Verify bio cannot exceed 150 characters."""
        long_bio = "a" * 151
        update_data = {
            "full_name": "Existing User",
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
            "full_name": "Existing User",
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


class ChangePasswordTests(APITestCase):
    def setUp(self):
        self.change_password_url = reverse("user-change-password")
        self.username = "testuser@example.com"
        self.password = "OldPassword123!"
        self.user = User.objects.create_user(
            username=self.username,
            email=self.username,
            password=self.password
        )
        self.client.force_authenticate(user=self.user)

    def test_change_password_success(self):
        """Verify password can be updated successfully and logins work with new credentials."""
        data = {
            "current_password": self.password,
            "new_password": "NewPassword1234!",
            "confirm_password": "NewPassword1234!"
        }
        response = self.client.put(self.change_password_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Password updated successfully.")

        # Verify old password no longer works
        self.user.refresh_from_db()
        self.assertFalse(self.user.check_password(self.password))

        # Verify new password works
        self.assertTrue(self.user.check_password("NewPassword1234!"))

    def test_wrong_current_password(self):
        """Verify providing a wrong current password is blocked."""
        data = {
            "current_password": "WrongPassword123!",
            "new_password": "NewPassword1234!",
            "confirm_password": "NewPassword1234!"
        }
        response = self.client.put(self.change_password_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("current_password", response.data)

    def test_password_mismatch(self):
        """Verify mismatch between new password and confirm password is blocked."""
        data = {
            "current_password": self.password,
            "new_password": "NewPassword1234!",
            "confirm_password": "MismatchPassword!"
        }
        response = self.client.put(self.change_password_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("confirm_password", response.data)

    def test_same_old_and_new_password(self):
        """Verify that setting the new password to the current password is blocked."""
        data = {
            "current_password": self.password,
            "new_password": self.password,
            "confirm_password": self.password
        }
        response = self.client.put(self.change_password_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("new_password", response.data)

    def test_weak_password_length(self):
        """Verify weak password under 8 characters is blocked."""
        data = {
            "current_password": self.password,
            "new_password": "short",
            "confirm_password": "short"
        }
        response = self.client.put(self.change_password_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("new_password", response.data)


class DeleteAccountTests(APITestCase):
    def setUp(self):
        self.delete_account_url = reverse("user-delete-account")
        self.username = "deleteuser@example.com"
        self.password = "DeletePassword123!"
        self.user = User.objects.create_user(
            username=self.username,
            email=self.username,
            password=self.password
        )
        self.user.profile.full_name = "To Delete"
        self.user.profile.save()

        from skills.models import Skill
        from tasks.models import Task, TaskCompletion
        from streaks.models import Streak

        self.skill = Skill.objects.create(user=self.user, name="Temporary Skill")
        self.task = Task.objects.create(user=self.user, skill=self.skill, title="Temporary Task")
        self.completion = TaskCompletion.objects.create(user=self.user, task=self.task, skill=self.skill)
        self.streak = self.user.streak

        self.client.force_authenticate(user=self.user)

    def test_delete_account_success(self):
        """Verify successful account deletion removes User and all related data."""
        data = {
            "confirm_text": "DELETE",
            "password": self.password
        }
        
        from skills.models import Skill
        from tasks.models import Task, TaskCompletion
        from streaks.models import Streak

        self.assertEqual(User.objects.filter(pk=self.user.pk).count(), 1)
        self.assertEqual(UserProfile.objects.filter(user=self.user).count(), 1)
        self.assertEqual(Skill.objects.filter(user=self.user).count(), 1)
        self.assertEqual(Task.objects.filter(user=self.user).count(), 1)
        self.assertEqual(TaskCompletion.objects.filter(user=self.user).count(), 1)
        self.assertEqual(Streak.objects.filter(user=self.user).count(), 1)

        response = self.client.delete(self.delete_account_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Account deleted successfully.")

        self.assertEqual(User.objects.filter(pk=self.user.pk).count(), 0)
        self.assertEqual(UserProfile.objects.filter(user_id=self.user.pk).count(), 0)
        self.assertEqual(Skill.objects.filter(user_id=self.user.pk).count(), 0)
        self.assertEqual(Task.objects.filter(user_id=self.user.pk).count(), 0)
        self.assertEqual(TaskCompletion.objects.filter(user_id=self.user.pk).count(), 0)
        self.assertEqual(Streak.objects.filter(user_id=self.user.pk).count(), 0)

    def test_wrong_confirm_text(self):
        """Verify wrong confirm text is blocked."""
        data = {
            "confirm_text": "WRONGTEXT",
            "password": self.password
        }
        response = self.client.delete(self.delete_account_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("confirm_text", response.data)

    def test_wrong_password(self):
        """Verify wrong password is blocked."""
        data = {
            "confirm_text": "DELETE",
            "password": "WrongPassword123!"
        }
        response = self.client.delete(self.delete_account_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)


