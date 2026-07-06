from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .permissions import IsAdminUser
from .serializers import QuickActionInputSerializer
from .services import seed_initial_data, trigger_quick_action
from . import selectors

class AdminDashboardSummaryView(APIView):
    """
    Unified API view that compiles and returns all admin dashboard aggregates
    in a single optimized response payload.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        selectors.bootstrap_lifecycle_events()
        period = request.query_params.get('period', 'month')
        is_full = request.query_params.get('full', 'true').lower() == 'true'
        
        data = {
            'stats': selectors.get_statistics(period=period),
            'charts': selectors.get_charts_data(period=period),
        }
        
        if is_full:
            data.update({
                'recent_users': selectors.get_recent_users(),
                'recent_activity': selectors.get_recent_activities(),
                'system_health': selectors.get_system_health(),
                'database': selectors.get_database_overview(),
                'top_skills': selectors.get_top_skills(),
                'feedback': selectors.get_feedback(request=request),
                'notifications': selectors.get_notifications()
            })
            
        print("--- DEBUG BACKEND RESPONSE DATA ---")
        print(f"Stats keys: {list(data.get('stats', {}).keys())}")
        for k, v in data.get('stats', {}).items():
            print(f"  Stat {k}: value={v.get('value')}, trend={v.get('trend')}, direction={v.get('trend_direction')}, sparkline_len={len(v.get('sparkline', []))}")
        print(f"Charts keys: {list(data.get('charts', {}).keys())}")
        if is_full:
            print(f"Database overview total size: {data.get('database', {}).get('total_size')}")
            print(f"Latest feedback records count: {len(data.get('feedback', []))}")
        print("-----------------------------------")
            
        return Response(data, status=status.HTTP_200_OK)


class AdminQuickActionView(APIView):
    """
    API view for executing administrative system triggers (Backups, Analytical Reports, Alerts).
    """
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = QuickActionInputSerializer(data=request.data)
        if serializer.is_valid():
            action_type = serializer.validated_data['action_type']
            username = request.user.username or "admin"
            result = trigger_quick_action(action_type, username)
            
            if result['status'] == 'success':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUserGrowthChartView(APIView):
    """
    API View to retrieve User Growth statistics filtered by period.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        period = request.query_params.get('period', 'month')
        data = selectors.get_user_growth(period=period)
        return Response({'user_growth': data}, status=status.HTTP_200_OK)


class AdminTaskCompletionChartView(APIView):
    """
    API View to retrieve Task Completion statistics filtered by period.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        period = request.query_params.get('period', 'month')
        data = selectors.get_task_completion(period=period)
        return Response({'task_completion': data}, status=status.HTTP_200_OK)


class AdminActivityChartView(APIView):
    """
    API View to retrieve Weekly/Monthly/Yearly Activity stats filtered by period.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        period = request.query_params.get('period', 'month')
        data = selectors.get_activity(period=period)
        return Response({'weekly_activity': data}, status=status.HTTP_200_OK)


from django.contrib.auth import get_user_model
from django.db.models import Q, Count
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError
from skills.models import Skill
from tasks.models import Task
from .models import AdminActivityLog, UserLifecycleEvent
from .serializers import AdminUserSerializer, AdminUserUpdateSerializer, AdminUserCreateSerializer, AdminUserPasswordChangeSerializer

User = get_user_model()

class AdminUsersListView(APIView):
    """
    List view for administrator user management, including search, filters,
    sorting, dynamic summary statistics, and chunk pagination.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        search = request.query_params.get('search', '').strip()
        role = request.query_params.get('role', 'all').strip().lower()
        status_param = request.query_params.get('status', 'all').strip().lower()
        sort = request.query_params.get('sort', 'newest').strip().lower()
        
        try:
            page = int(request.query_params.get('page', 1))
            limit = int(request.query_params.get('limit', 25))
        except ValueError:
            page = 1
            limit = 25

        queryset = User.objects.all().select_related('profile')

        # 1. Searching
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(profile__full_name__icontains=search)
            )

        # 2. Filtering by Role
        if role == 'user':
            queryset = queryset.filter(is_staff=False, is_superuser=False)
        elif role == 'staff':
            queryset = queryset.filter(is_staff=True, is_superuser=False)
        elif role == 'super_admin':
            queryset = queryset.filter(is_superuser=True)

        # 3. Filtering by Status
        if status_param == 'active':
            queryset = queryset.filter(is_active=True)
        elif status_param == 'inactive':
            queryset = queryset.filter(is_active=False)

        # 4. Sorting
        if sort == 'oldest':
            queryset = queryset.order_by('date_joined')
        elif sort == 'recently_active':
            queryset = queryset.order_by('-last_login')
        else:  # default or 'newest'
            queryset = queryset.order_by('-date_joined')

        # Pagination calculations
        total_count = queryset.count()
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        
        users_chunk = queryset[start_idx:end_idx]
        has_more = end_idx < total_count
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1

        serializer = AdminUserSerializer(users_chunk, many=True, context={'request': request})

        # Core statistics metrics for user management dashboard header
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        stats = {
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'staff_users': User.objects.filter(is_staff=True).count(),
            'new_users_this_month': User.objects.filter(date_joined__gte=start_of_month).count()
        }

        return Response({
            'users': serializer.data,
            'stats': stats,
            'current_page': page,
            'total_pages': total_pages,
            'has_more': has_more,
            'total_count': total_count
        }, status=status.HTTP_200_OK)


class AdminUserDetailView(APIView):
    """
    Detail endpoint for a user account, supporting retrieval, PATCH updates,
    and deletion with strict role/permission checks.
    """
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            user = User.objects.select_related('profile').get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Fetch skills annotated with completions/totals
        skills = Skill.objects.filter(user=user).annotate(
            total_tasks_count=Count('tasks'),
            completed_tasks_count=Count('tasks', filter=Q(tasks__status='completed'))
        ).order_by('-created_at')

        skills_data = []
        for s in skills:
            total = s.total_tasks_count
            completed = s.completed_tasks_count
            progress = int(completed / total * 100) if total > 0 else 0
            skills_data.append({
                'id': s.id,
                'name': s.name,
                'color': s.color,
                'target_tasks': s.target_tasks,
                'completed_tasks': completed,
                'total_tasks': total,
                'progress': progress,
                'created_at': s.created_at.strftime('%Y-%m-%d %H:%M:%S') if s.created_at else None
            })

        # Fetch user tasks
        tasks = Task.objects.filter(user=user).select_related('skill').order_by('-created_at')
        tasks_data = [{
            'id': t.id,
            'title': t.title,
            'description': t.description,
            'status': t.status,
            'skill_id': t.skill_id,
            'skill_name': t.skill.name if t.skill else None,
            'skill_color': t.skill.color if t.skill else None,
            'created_at': t.created_at.strftime('%Y-%m-%d %H:%M:%S') if t.created_at else None
        } for t in tasks]

        # Fetch user activity logs
        logs = AdminActivityLog.objects.filter(username=user.username).order_by('-created_at')[:50]
        logs_data = [{
            'id': l.id,
            'action': l.action,
            'created_at': l.created_at.strftime('%Y-%m-%d %H:%M:%S')
        } for l in logs]

        # Fetch timeline history
        lifecycle_events = UserLifecycleEvent.objects.filter(username=user.username).order_by('-timestamp')
        history_data = []
        for le in lifecycle_events:
            history_data.append({
                'event': "Account created" if le.event_type == 'create' else f"Lifecycle: {le.event_type.upper()}",
                'timestamp': le.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            })
        if user.last_login:
            history_data.append({
                'event': "Last login",
                'timestamp': user.last_login.strftime('%Y-%m-%d %H:%M:%S')
            })
        # Sort history chronologically by timestamp
        history_data.sort(key=lambda x: x['timestamp'], reverse=True)

        return Response({
            'user': AdminUserSerializer(user, context={'request': request}).data,
            'skills': skills_data,
            'tasks': tasks_data,
            'activity_logs': logs_data,
            'history': history_data
        }, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        try:
            user = User.objects.select_related('profile').get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Protect Super Admin accounts: non-super admin requesting users cannot modify a super admin
        if user.is_superuser and not request.user.is_superuser:
            raise PermissionDenied("Only super admins can modify super admin accounts.")

        serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            AdminActivityLog.objects.create(
                username=user.username,
                action=f"Admin updated profile for {user.username}"
            )
            # Re-read and return updated detail
            return Response(AdminUserSerializer(user, context={'request': request}).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Protect Super Admin accounts: non-super admin requesting users cannot delete a super admin
        if user.is_superuser and not request.user.is_superuser:
            raise PermissionDenied("Only super admins can delete super admin accounts.")

        # Create activity log BEFORE deletion so username relation exists
        AdminActivityLog.objects.create(
            username=request.user.username,
            action=f"Admin {request.user.username} deleted user {user.username}"
        )
        
        user.delete()
        return Response({'detail': 'User deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


class AdminSkillDetailView(APIView):
    """
    API view allowing administrators to edit or delete a user's skills inline.
    """
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            skill = Skill.objects.get(pk=pk)
        except Skill.DoesNotExist:
            return Response({'detail': 'Skill not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Protect super admin skill editing if skill belongs to a super admin and admin is not super admin
        if skill.user.is_superuser and not request.user.is_superuser:
            raise PermissionDenied("Only super admins can modify super admin accounts.")

        name = request.data.get('name', skill.name).strip()
        color = request.data.get('color', skill.color).strip()
        try:
            target_tasks = int(request.data.get('target_tasks', skill.target_tasks))
        except (ValueError, TypeError):
            target_tasks = skill.target_tasks

        if not name:
            return Response({'detail': 'Skill name cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        skill.name = name
        skill.color = color
        skill.target_tasks = target_tasks
        skill.save()

        AdminActivityLog.objects.create(
            username=request.user.username,
            action=f"Admin {request.user.username} updated skill: {skill.name} for user {skill.user.username}"
        )

        return Response({'detail': 'Skill updated successfully.'}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            skill = Skill.objects.get(pk=pk)
        except Skill.DoesNotExist:
            return Response({'detail': 'Skill not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Protect super admin skill deletion if skill belongs to a super admin and admin is not super admin
        if skill.user.is_superuser and not request.user.is_superuser:
            raise PermissionDenied("Only super admins can modify super admin accounts.")

        AdminActivityLog.objects.create(
            username=request.user.username,
            action=f"Admin {request.user.username} deleted skill: {skill.name} for user {skill.user.username}"
        )
        
        skill.delete()
        return Response({'detail': 'Skill deleted successfully.'}, status=status.HTTP_200_OK)


class AdminTaskDetailView(APIView):
    """
    API view allowing administrators to edit or delete a user's tasks inline.
    """
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return Response({'detail': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Protect super admin tasks from non-super admins
        if task.user.is_superuser and not request.user.is_superuser:
            raise PermissionDenied("Only super admins can modify super admin accounts.")

        title = request.data.get('title', task.title).strip()
        description = request.data.get('description', task.description)
        status_val = request.data.get('status', task.status).strip().lower()

        if not title:
            return Response({'detail': 'Task title cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
        if status_val not in ['pending', 'completed']:
            return Response({'detail': 'Invalid status choice.'}, status=status.HTTP_400_BAD_REQUEST)

        # If status is changing to/from completed, keep TaskCompletion inline
        from tasks.models import TaskCompletion
        if task.status != status_val:
            if status_val == 'completed':
                TaskCompletion.objects.get_or_create(
                    task=task,
                    user=task.user,
                    skill=task.skill
                )
            else:
                TaskCompletion.objects.filter(task=task).delete()

        task.title = title
        task.description = description
        task.status = status_val
        task.save()

        AdminActivityLog.objects.create(
            username=request.user.username,
            action=f"Admin {request.user.username} updated task: {task.title} for user {task.user.username}"
        )

        return Response({'detail': 'Task updated successfully.'}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return Response({'detail': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Protect super admin tasks from non-super admins
        if task.user.is_superuser and not request.user.is_superuser:
            raise PermissionDenied("Only super admins can modify super admin accounts.")

        AdminActivityLog.objects.create(
            username=request.user.username,
            action=f"Admin {request.user.username} deleted task: {task.title} for user {task.user.username}"
        )

        task.delete()
        return Response({'detail': 'Task deleted successfully.'}, status=status.HTTP_200_OK)


from .serializers import AdminSkillGlobalUpdateSerializer, AdminSkillCreateSerializer

class AdminSkillListView(APIView):
    """
    Unified API view to retrieve grouped skills summary list and stats.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        search = request.query_params.get('search', '').strip()

        # Dynamic totals
        total_skills = Skill.objects.values('name').distinct().count()
        active_learners = Skill.objects.values('user').distinct().count()
        total_tasks = Task.objects.count()
        completed_tasks_total = Task.objects.filter(status='completed').count()
        completion_rate = int(completed_tasks_total / total_tasks * 100) if total_tasks > 0 else 0

        # Grouped listing query
        queryset = Skill.objects.values('name').annotate(
            total_users=Count('user', distinct=True),
            total_tasks=Count('tasks'),
            completed_tasks=Count('tasks', filter=Q(tasks__status='completed'))
        )

        if search:
            queryset = queryset.filter(name__icontains=search)

        skills_data = []
        for item in queryset:
            name = item['name']
            total_users = item['total_users']
            total_tasks = item['total_tasks']
            completed_tasks = item['completed_tasks']
            completion_pct = int(completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            # Fetch color and default info from the first matching record
            first_skill = Skill.objects.filter(name__iexact=name).first()
            color = first_skill.color if first_skill else '#3B82F6'
            
            skills_data.append({
                'name': name,
                'color': color,
                'total_users': total_users,
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'completion_rate': completion_pct
            })

        # Order priority:
        # 1. total_users DESC
        # 2. completion_rate DESC
        # 3. completed_tasks DESC
        skills_data.sort(key=lambda x: (x['total_users'], x['completion_rate'], x['completed_tasks']), reverse=True)

        return Response({
            'skills': skills_data,
            'stats': {
                'total_skills': total_skills,
                'active_learners': active_learners,
                'total_tasks': total_tasks,
                'completion_rate': completion_rate
            }
        }, status=status.HTTP_200_OK)


class AdminSkillGroupDetailView(APIView):
    """
    API view to load the detailed panel configuration of a single skill group by name.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        name = request.query_params.get('name', '').strip()
        if not name:
            return Response({'detail': 'Skill name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        skills = Skill.objects.filter(name__iexact=name).select_related('user', 'user__profile').annotate(
            total_tasks_count=Count('tasks'),
            completed_tasks_count=Count('tasks', filter=Q(tasks__status='completed'))
        )

        if not skills.exists():
            return Response({'detail': 'Skill group not found.'}, status=status.HTTP_404_NOT_FOUND)

        total_learners = skills.count()
        total_tasks = sum(s.total_tasks_count for s in skills)
        completed_tasks = sum(s.completed_tasks_count for s in skills)
        avg_completion = int(completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        first_created = skills.order_by('created_at').first().created_at
        created_date_str = first_created.strftime('%Y-%m-%d') if first_created else None
        color = skills.first().color

        # Users learning this skill name ordered by progress DESC, then completed tasks DESC
        learners_data = []
        for s in skills:
            progress_pct = int(s.completed_tasks_count / s.total_tasks_count * 100) if s.total_tasks_count > 0 else 0
            
            # Absolute avatar path serialization helper
            avatar_url = None
            if hasattr(s.user, 'profile') and s.user.profile.avatar:
                avatar_url = request.build_absolute_uri(s.user.profile.avatar.url)

            learners_data.append({
                'user_id': s.user.id,
                'username': s.user.username,
                'full_name': s.user.profile.full_name if hasattr(s.user, 'profile') else '',
                'avatar': avatar_url,
                'progress': progress_pct,
                'completed_tasks': s.completed_tasks_count,
                'total_tasks': s.total_tasks_count,
                'skill_id': s.id,
                'target_tasks': s.target_tasks
            })

        learners_data.sort(key=lambda x: (x['progress'], x['completed_tasks']), reverse=True)

        return Response({
            'name': name,
            'color': color,
            'total_learners': total_learners,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'avg_completion': avg_completion,
            'created_date': created_date_str,
            'learners': learners_data
        }, status=status.HTTP_200_OK)


class AdminSkillGlobalEditView(APIView):
    """
    API view to rename or recolor a skill group globally.
    """
    permission_classes = [IsAdminUser]

    def patch(self, request):
        serializer = AdminSkillGlobalUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        old_name = serializer.validated_data['old_name']
        new_name = serializer.validated_data['new_name']
        color = serializer.validated_data['color']

        skills = Skill.objects.filter(name__iexact=old_name)
        if not skills.exists():
            return Response({'detail': 'Skill group not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check unique constraint collision for each user before updating
        # If user already has new_name, we delete the duplicate and merge?
        # Or simply prevent if collision exists, or standard Django integrity handler.
        # Let's perform a safe bulk update:
        for s in skills:
            if Skill.objects.filter(user=s.user, name=new_name).exclude(pk=s.pk).exists():
                # Collision: User already has the new skill name, skip or merge
                continue
            s.name = new_name
            s.color = color
            s.save()

        AdminActivityLog.objects.create(
            username=request.user.username,
            action=f"Admin renamed {old_name} to {new_name}"
        )

        return Response({'detail': 'Skill group updated globally.'}, status=status.HTTP_200_OK)


class AdminSkillGlobalDeleteView(APIView):
    """
    API view to delete a skill group globally.
    """
    permission_classes = [IsAdminUser]

    def delete(self, request):
        name = request.query_params.get('name', '').strip()
        if not name:
            return Response({'detail': 'Skill name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        skills = Skill.objects.filter(name__iexact=name)
        if not skills.exists():
            return Response({'detail': 'Skill group not found.'}, status=status.HTTP_404_NOT_FOUND)

        skills.delete()

        AdminActivityLog.objects.create(
            username=request.user.username,
            action=f"Admin deleted {name} group"
        )

        return Response({'detail': 'Skill group deleted successfully.'}, status=status.HTTP_200_OK)


class AdminSkillCreateView(APIView):
    """
    API view to add a skill to a specific user.
    """
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = AdminSkillCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_id = serializer.validated_data['user_id']
        name = serializer.validated_data['name'].strip()
        color = serializer.validated_data.get('color', '#3B82F6')
        target_tasks = serializer.validated_data['target_tasks']

        try:
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': f"User with ID '{user_id}' not found."}, status=status.HTTP_404_NOT_FOUND)

        if Skill.objects.filter(user=target_user, name__iexact=name).exists():
            return Response({'detail': "User already has this skill"}, status=status.HTTP_400_BAD_REQUEST)

        skill = Skill.objects.create(
            user=target_user,
            name=name,
            color=color,
            target_tasks=target_tasks
        )

        from notifications.notification_service import create_notification
        create_notification(
            target_user,
            "New Skill Added",
            f"You started learning {name} 🚀",
            "info",
            metadata={
                'skill_id': skill.id,
                'skill_name': skill.name,
                'progress': 0,
                'completed_tasks': 0,
                'total_tasks': skill.target_tasks,
            },
        )

        # Trigger activity log
        AdminActivityLog.objects.create(
            username=request.user.username,
            action=f"Admin assigned {name} skill to {target_user.username}"
        )

        return Response({'detail': 'Skill created successfully.', 'id': skill.id}, status=status.HTTP_201_CREATED)


class AdminUserCreateView(APIView):
    """
    API view for admin to create a new user account, profile, and trigger welcome email.
    """
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = AdminUserCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            
            from notifications.notification_service import create_notification
            create_notification(
                user,
                "Welcome to Progressly 🎉",
                "Your account is ready. Start building your learning path.",
                "success",
                metadata={
                    'source': 'admin_created_user',
                },
            )

            # Send welcome email using a daemon thread safely
            from users.email_service import send_welcome_email
            from threading import Thread
            import logging
            logger = logging.getLogger(__name__)
            try:
                full_name = getattr(user, 'profile', None) and user.profile.full_name or user.first_name or user.username
                Thread(
                    target=send_welcome_email,
                    args=(user.email, full_name),
                    daemon=True
                ).start()
            except Exception:
                logger.exception("Failed to start welcome email thread.")

            # Record activity log for action
            AdminActivityLog.objects.create(
                username=request.user.username,
                action=f"Admin created user account for {user.username}"
            )

            # Return serialized representation of the created user
            return Response(
                AdminUserSerializer(user, context={'request': request}).data, 
                status=status.HTTP_201_CREATED
            )
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUserPasswordChangeView(APIView):
    """
    API view for admin to change a user's password.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.select_related('profile').get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Protect Super Admin accounts: non-super admin requesting users cannot modify a super admin
        if user.is_superuser and not request.user.is_superuser:
            raise PermissionDenied("Only super admins can change a super admin account's password.")

        serializer = AdminUserPasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            new_password = serializer.validated_data['new_password']
            user.set_password(new_password)
            user.save()

            # Record activity log for action
            AdminActivityLog.objects.create(
                username=request.user.username,
                action=f"Admin changed password for user: {user.email}"
            )

            # Send email notification safely in background thread
            from users.email_service import send_admin_reset_password_email
            from threading import Thread
            import logging
            logger = logging.getLogger(__name__)
            try:
                full_name = getattr(user, 'profile', None) and user.profile.full_name or user.first_name or user.username
                Thread(
                    target=send_admin_reset_password_email,
                    args=(user.email, full_name),
                    daemon=True
                ).start()
            except Exception:
                logger.exception("Failed to start password reset email thread.")

            return Response({'detail': 'Password updated successfully.'}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




