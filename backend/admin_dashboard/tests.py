from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import UserProfile
from skills.models import Skill
from tasks.models import Task
from admin_dashboard.models import AdminActivityLog

User = get_user_model()

class AdminUserManagementTests(APITestCase):

    def setUp(self):
        # Create a Super Admin
        self.super_admin = User.objects.create_superuser(
            username='superadmin',
            email='superadmin@progressly.com',
            password='superpassword'
        )
        self.super_profile = self.super_admin.profile
        self.super_profile.full_name = "Super Admin User"
        self.super_profile.save()
        
        # Create a Staff Admin
        self.staff_admin = User.objects.create_user(
            username='staffadmin',
            email='staffadmin@progressly.com',
            password='staffpassword',
            is_staff=True
        )
        self.staff_profile = self.staff_admin.profile
        self.staff_profile.full_name = "Staff Admin User"
        self.staff_profile.save()
        
        # Create normal users
        self.regular_user = User.objects.create_user(
            username='johndoe',
            email='john@example.com',
            password='johnpassword'
        )
        self.regular_profile = self.regular_user.profile
        self.regular_profile.full_name = "John Doe"
        self.regular_profile.country = "USA"
        self.regular_profile.save()
        
        self.inactive_user = User.objects.create_user(
            username='janedoe',
            email='jane@example.com',
            password='janepassword',
            is_active=False
        )
        self.inactive_profile = self.inactive_user.profile
        self.inactive_profile.full_name = "Jane Doe"
        self.inactive_profile.country = "Canada"
        self.inactive_profile.save()

        # Create skill and task for regular_user
        self.skill = Skill.objects.create(user=self.regular_user, name="Python", color="#123456", target_tasks=5)
        self.task = Task.objects.create(user=self.regular_user, skill=self.skill, title="Learn Python Basics", status="pending")

        self.list_url = reverse('admin-users-list')

    def test_unauthenticated_cannot_access_list(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_regular_user_cannot_access_list(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_admin_can_access_list(self):
        self.client.force_authenticate(user=self.staff_admin)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('users', response.data)
        self.assertIn('stats', response.data)
        self.assertEqual(response.data['stats']['total_users'], User.objects.count())

    def test_user_list_filtering_by_role(self):
        self.client.force_authenticate(user=self.staff_admin)
        
        # Filter super admin
        response = self.client.get(self.list_url, {'role': 'super_admin'})
        self.assertEqual(len(response.data['users']), 1)
        self.assertEqual(response.data['users'][0]['username'], 'superadmin')
        
        # Filter normal user
        response = self.client.get(self.list_url, {'role': 'user'})
        self.assertEqual(len(response.data['users']), 2) # johndoe & janedoe

    def test_user_list_filtering_by_status(self):
        self.client.force_authenticate(user=self.staff_admin)
        
        # Filter active
        response = self.client.get(self.list_url, {'status': 'active'})
        active_usernames = [u['username'] for u in response.data['users']]
        self.assertIn('johndoe', active_usernames)
        self.assertNotIn('janedoe', active_usernames)

        # Filter inactive
        response = self.client.get(self.list_url, {'status': 'inactive'})
        inactive_usernames = [u['username'] for u in response.data['users']]
        self.assertIn('janedoe', inactive_usernames)
        self.assertNotIn('johndoe', inactive_usernames)

    def test_user_list_search(self):
        self.client.force_authenticate(user=self.staff_admin)
        
        response = self.client.get(self.list_url, {'search': 'john'})
        self.assertEqual(len(response.data['users']), 1)
        self.assertEqual(response.data['users'][0]['username'], 'johndoe')

    def test_user_detail_view(self):
        self.client.force_authenticate(user=self.staff_admin)
        
        detail_url = reverse('admin-user-detail', kwargs={'pk': self.regular_user.pk})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['username'], 'johndoe')
        self.assertEqual(len(response.data['skills']), 1)
        self.assertEqual(response.data['skills'][0]['name'], 'Python')
        self.assertEqual(len(response.data['tasks']), 1)
        self.assertEqual(response.data['tasks'][0]['title'], 'Learn Python Basics')

    def test_super_admin_protection_on_patch(self):
        # Staff admin attempts to modify super admin profile -> should be forbidden/denied
        self.client.force_authenticate(user=self.staff_admin)
        detail_url = reverse('admin-user-detail', kwargs={'pk': self.super_admin.pk})
        
        response = self.client.patch(detail_url, {'username': 'newsupername'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Super admin modifies super admin profile -> succeeds
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.patch(detail_url, {'username': 'newsupername'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.super_admin.refresh_from_db()
        self.assertEqual(self.super_admin.username, 'newsupername')

    def test_super_admin_protection_on_delete(self):
        # Staff admin attempts to delete super admin -> should be forbidden/denied
        self.client.force_authenticate(user=self.staff_admin)
        detail_url = reverse('admin-user-detail', kwargs={'pk': self.super_admin.pk})
        
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(User.objects.filter(pk=self.super_admin.pk).exists())

        # Super admin deletes staff admin -> succeeds and creates log
        self.client.force_authenticate(user=self.super_admin)
        staff_detail_url = reverse('admin-user-detail', kwargs={'pk': self.staff_admin.pk})
        response = self.client.delete(staff_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=self.staff_admin.pk).exists())
        
        # Verify activity log creation
        self.assertTrue(AdminActivityLog.objects.filter(action__icontains="deleted user staffadmin").exists())

    def test_admin_inline_skill_management(self):
        self.client.force_authenticate(user=self.staff_admin)
        skill_url = reverse('admin-skill-detail', kwargs={'pk': self.skill.pk})
        
        # Update skill
        response = self.client.patch(skill_url, {'name': 'Python Advanced', 'color': '#ffffff', 'target_tasks': 10}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.skill.refresh_from_db()
        self.assertEqual(self.skill.name, 'Python Advanced')
        self.assertEqual(self.skill.color, '#ffffff')
        self.assertEqual(self.skill.target_tasks, 10)
        self.assertTrue(AdminActivityLog.objects.filter(action__icontains="updated skill: Python Advanced").exists())

        # Delete skill
        response = self.client.delete(skill_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Skill.objects.filter(pk=self.skill.pk).exists())
        self.assertTrue(AdminActivityLog.objects.filter(action__icontains="deleted skill: Python Advanced").exists())

    def test_admin_inline_task_management(self):
        self.client.force_authenticate(user=self.staff_admin)
        task_url = reverse('admin-task-detail', kwargs={'pk': self.task.pk})
        
        # Update task
        response = self.client.patch(task_url, {'title': 'Updated Title', 'status': 'completed'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task.refresh_from_db()
        self.assertEqual(self.task.title, 'Updated Title')
        self.assertEqual(self.task.status, 'completed')
        self.assertTrue(AdminActivityLog.objects.filter(action__icontains="updated task: Updated Title").exists())

        # Delete task
        response = self.client.delete(task_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Task.objects.filter(pk=self.task.pk).exists())
        self.assertTrue(AdminActivityLog.objects.filter(action__icontains="deleted task: Updated Title").exists())

    def test_admin_profile_update_and_sync(self):
        self.client.force_authenticate(user=self.staff_admin)
        detail_url = reverse('admin-user-detail', kwargs={'pk': self.regular_user.pk})
        
        payload = {
            'username': 'newjohn',
            'email': 'newjohn@example.com',
            'full_name': 'New John Name',
            'bio': 'New Bio Text',
            'country': 'UK',
            'is_active': False
        }
        response = self.client.patch(detail_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify database update
        self.regular_user.refresh_from_db()
        self.regular_profile.refresh_from_db()
        self.assertEqual(self.regular_user.username, 'newjohn')
        self.assertEqual(self.regular_user.email, 'newjohn@example.com')
        self.assertEqual(self.regular_user.is_active, False)
        self.assertEqual(self.regular_profile.full_name, 'New John Name')
        self.assertEqual(self.regular_profile.bio, 'New Bio Text')
        self.assertEqual(self.regular_profile.country, 'UK')
        
        # Verify activity log creation
        self.assertTrue(AdminActivityLog.objects.filter(
            username='newjohn',
            action='Admin updated profile for newjohn'
        ).exists())

    def test_skills_list(self):
        self.client.force_authenticate(user=self.staff_admin)
        
        # Add another user with the Python skill to test sorting priority
        other_user = User.objects.create_user(username='otheruser', email='other@example.com', password='password')
        other_profile = other_user.profile
        other_profile.full_name = "Other User Name"
        other_profile.save()
        Skill.objects.create(user=other_user, name="Python", color="#123456", target_tasks=5)

        # Create another skill group with 1 user
        Skill.objects.create(user=self.regular_user, name="Java", color="#999999", target_tasks=10)

        list_url = reverse('admin-skills-list-summary')
        response = self.client.get(list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify stats
        self.assertEqual(response.data['stats']['total_skills'], 2)  # Python, Java
        self.assertEqual(response.data['stats']['active_learners'], 2)  # regular_user, other_user
        
        # Verify python is first because total_users=2, java is second because total_users=1
        self.assertEqual(response.data['skills'][0]['name'], 'Python')
        self.assertEqual(response.data['skills'][0]['total_users'], 2)
        self.assertEqual(response.data['skills'][1]['name'], 'Java')
        self.assertEqual(response.data['skills'][1]['total_users'], 1)

    def test_skill_group_detail(self):
        self.client.force_authenticate(user=self.staff_admin)
        
        detail_url = reverse('admin-skills-group-detail')
        response = self.client.get(detail_url, {'name': 'Python'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Python')
        self.assertEqual(response.data['total_learners'], 1)
        self.assertEqual(response.data['total_tasks'], 1)
        self.assertEqual(response.data['learners'][0]['username'], 'johndoe')

    def test_skill_global_edit(self):
        self.client.force_authenticate(user=self.staff_admin)
        edit_url = reverse('admin-skills-global-edit')
        
        payload = {
            'old_name': 'Python',
            'new_name': 'Python Programming',
            'color': '#ff00ff'
        }
        response = self.client.patch(edit_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.skill.refresh_from_db()
        self.assertEqual(self.skill.name, 'Python Programming')
        self.assertEqual(self.skill.color, '#ff00ff')
        
        # Verify activity log
        self.assertTrue(AdminActivityLog.objects.filter(
            username=self.staff_admin.username,
            action='Admin renamed Python to Python Programming'
        ).exists())

    def test_skill_global_delete(self):
        self.client.force_authenticate(user=self.staff_admin)
        delete_url = reverse('admin-skills-global-delete')
        
        response = self.client.delete(delete_url + '?name=Python')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertFalse(Skill.objects.filter(name='Python').exists())
        
        # Verify activity log
        self.assertTrue(AdminActivityLog.objects.filter(
            username=self.staff_admin.username,
            action='Admin deleted Python group'
        ).exists())

    def test_skill_create(self):
        self.client.force_authenticate(user=self.staff_admin)
        create_url = reverse('admin-skills-create')
        
        payload = {
            'user_id': self.inactive_user.id,
            'name': 'Golang',
            'color': '#00ff00',
            'target_tasks': 15
        }
        response = self.client.post(create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        self.assertTrue(Skill.objects.filter(user=self.inactive_user, name='Golang').exists())
        # Verify activity log
        self.assertTrue(AdminActivityLog.objects.filter(
            username=self.staff_admin.username,
            action='Admin assigned Golang skill to janedoe'
        ).exists())

    def test_skill_create_duplicate(self):
        self.client.force_authenticate(user=self.staff_admin)
        create_url = reverse('admin-skills-create')
        
        # self.skill is Python for self.regular_user
        payload = {
            'user_id': self.regular_user.id,
            'name': 'Python',
            'color': '#3b82f6',
            'target_tasks': 10
        }
        response = self.client.post(create_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'User already has this skill')


