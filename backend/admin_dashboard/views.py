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
from .serializers import AdminUserSerializer, AdminUserUpdateSerializer

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
                username=request.user.username,
                action=f"Admin updated user profile: {user.username}"
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

