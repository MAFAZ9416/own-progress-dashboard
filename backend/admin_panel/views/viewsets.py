import os
import csv
import json
from django.conf import settings
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.http import HttpResponse, FileResponse
from django.core.management import call_command
from django.core.mail import EmailMultiAlternatives
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

from admin_panel.models import Feedback, EmailLog, SystemSetting, AdminNotification, BackupLog, ActivityLog
from admin_panel.serializers import (
    AdminUserSerializer, AdminSkillSerializer, AdminTaskSerializer,
    FeedbackSerializer, EmailLogSerializer, SystemSettingSerializer,
    AdminNotificationSerializer, BackupLogSerializer, ActivityLogSerializer,
    GroupSerializer, PermissionSerializer
)
from admin_panel.services import log_activity

from skills.models import Skill
from tasks.models import Task

User = get_user_model()

# ─── USER ViewSet ────────────────────────────────────────────────────
class UserManagementViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related('profile').prefetch_related('skills', 'tasks', 'login_history')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(profile__full_name__icontains=search)
            )
        role = self.request.query_params.get('role')
        if role == 'admin':
            qs = qs.filter(is_staff=True)
        elif role == 'user':
            qs = qs.filter(is_staff=False)
            
        status_param = self.request.query_params.get('status')
        if status_param == 'active':
            qs = qs.filter(is_active=True)
        elif status_param == 'disabled':
            qs = qs.filter(is_active=False)

        return qs

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        log_activity(request, "User Status Toggled", f"User {user.email} status set to {'active' if user.is_active else 'disabled'}", "warning")
        return Response({
            "status": "success",
            "is_active": user.is_active,
            "message": f"User account has been {'enabled' if user.is_active else 'disabled'} successfully."
        })

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get('password')
        if not new_password or len(new_password) < 6:
            return Response(
                {"error": "Password must be at least 6 characters."},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(new_password)
        user.save()
        log_activity(request, "User Password Reset", f"Reset password of user {user.email}", "warning")
        return Response({
            "status": "success",
            "message": f"Password for user {user.username} has been reset successfully."
        })

    @action(detail=True, methods=['post'])
    def assign_role(self, request, pk=None):
        user = self.get_object()
        role = request.data.get('role')
        if role == 'admin':
            user.is_staff = True
        elif role == 'user':
            user.is_staff = False
        else:
            return Response({"error": "Invalid role specified."}, status=status.HTTP_400_BAD_REQUEST)
        user.save()
        log_activity(request, "User Role Updated", f"Assigned role {role} to user {user.email}", "info")
        return Response({
            "status": "success",
            "is_staff": user.is_staff,
            "message": f"User role updated successfully."
        })

    @action(detail=True, methods=['get'])
    def login_history(self, request, pk=None):
        user = self.get_object()
        history = user.login_history.all().order_by('-login_time')
        from admin_panel.serializers import UserLoginHistorySerializer
        serializer = UserLoginHistorySerializer(history, many=True)
        return Response(serializer.data)

# ─── SKILLS ViewSet ──────────────────────────────────────────────────
class SkillsManagementViewSet(viewsets.ModelViewSet):
    queryset = Skill.objects.select_related('user').prefetch_related('tasks')
    serializer_class = AdminSkillSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        user_id = self.request.query_params.get('user_id')
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs

# ─── TASKS ViewSet ───────────────────────────────────────────────────
class TaskManagementViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related('user', 'skill')
    serializer_class = AdminTaskSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(title__icontains=search)
        task_status = self.request.query_params.get('status')
        if task_status:
            qs = qs.filter(status=task_status)
        user_id = self.request.query_params.get('user_id')
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs

# ─── FEEDBACK ViewSet ────────────────────────────────────────────────
class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.select_related('user').order_by('-created_at')
    serializer_class = FeedbackSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(email__icontains=search) | Q(message__icontains=search))
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        feedback = self.get_object()
        reply_msg = request.data.get('reply', '')
        
        feedback.status = 'resolved'
        feedback.reply = reply_msg
        feedback.save()
        log_activity(request, "Feedback Resolved", f"Resolved ticket #{feedback.id} from {feedback.email}", "info")
        return Response({"status": "success", "message": "Feedback resolved."})

# ─── EMAIL ViewSet ───────────────────────────────────────────────────
class EmailLogViewSet(viewsets.ModelViewSet):
    queryset = EmailLog.objects.all().order_by('-created_at')
    serializer_class = EmailLogSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(recipient__icontains=search) | Q(subject__icontains=search))
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        log_entry = self.get_object()
        try:
            msg = EmailMultiAlternatives(
                subject=log_entry.subject,
                body=log_entry.error_message or "Resending email...",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[log_entry.recipient]
            )
            msg.send()
            log_entry.status = 'delivered'
            log_entry.error_message = ''
            log_entry.save()
            log_activity(request, "Email Resend Success", f"Resent email log #{log_entry.id} to {log_entry.recipient}", "info")
            return Response({"status": "success", "message": "Email resent successfully."})
        except Exception as e:
            log_entry.status = 'failed'
            log_entry.error_message = str(e)
            log_entry.save()
            log_activity(request, "Email Resend Failed", f"Resend failed for email log #{log_entry.id} to {log_entry.recipient}", "warning")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# ─── NOTIFICATION ViewSet ────────────────────────────────────────────
class AdminNotificationViewSet(viewsets.ModelViewSet):
    queryset = AdminNotification.objects.select_related('recipient').order_by('-created_at')
    serializer_class = AdminNotificationSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['post'])
    def broadcast(self, request):
        title = request.data.get('title')
        message = request.data.get('message')
        if not title or not message:
            return Response({"error": "Title and message are required."}, status=status.HTTP_400_BAD_REQUEST)

        notif = AdminNotification.objects.create(
            title=title,
            message=message,
            is_sent=True
        )
        log_activity(request, "Broadcast Notification Sent", f"Broadcast notification #{notif.id} sent", "info")
        return Response({"status": "success", "message": "Broadcast sent successfully."})

# ─── BACKUP ViewSet ──────────────────────────────────────────────────
class BackupViewSet(viewsets.ModelViewSet):
    queryset = BackupLog.objects.all().order_by('-created_at')
    serializer_class = BackupLogSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['post'])
    def create_backup(self, request):
        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)

        filename = f"backup_{timezone_now_str()}.json"
        filepath = os.path.join(backup_dir, filename)

        try:
            with open(filepath, 'w') as f:
                call_command('dumpdata', indent=2, stdout=f)
            
            size = os.path.getsize(filepath)
            log_entry = BackupLog.objects.create(
                filename=filename,
                size_bytes=size,
                status='success'
            )
            log_activity(request, "Backup Created", f"Backup snapshot {filename} created", "info")
            return Response({"status": "success", "filename": filename})
        except Exception as e:
            BackupLog.objects.create(
                filename=filename,
                size_bytes=0,
                status='failed',
                error_message=str(e)
            )
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        log_entry = self.get_object()
        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        filepath = os.path.join(backup_dir, log_entry.filename)

        if not os.path.exists(filepath):
            return Response({"error": "Backup file not found on disk."}, status=status.HTTP_404_NOT_FOUND)

        try:
            call_command('loaddata', filepath)
            log_activity(request, "Backup Restored", f"Restored backup snapshot {log_entry.filename}", "danger")
            return Response({"status": "success", "message": "Restore completed."})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        log_entry = self.get_object()
        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        filepath = os.path.join(backup_dir, log_entry.filename)
        if os.path.exists(filepath):
            return FileResponse(open(filepath, 'rb'), content_type='application/json')
        return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)

def timezone_now_str():
    from django.utils import timezone
    return timezone.now().strftime("%Y%m%d_%H%M%S")

# ─── SETTINGS VIEW ───────────────────────────────────────────────────
class SystemSettingsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        configs = SystemSetting.objects.all()
        serializer = SystemSettingSerializer(configs, many=True)
        return Response(serializer.data)

    def post(self, request):
        configs = request.data.get('settings', [])
        for item in configs:
            SystemSetting.objects.filter(key=item.get('key')).update(value=item.get('value'))
        log_activity(request, "Settings Configuration Updated", "Modified application system configuration settings", "warning")
        return Response({"status": "success", "message": "Settings updated."})

# ─── REPORTS VIEW ────────────────────────────────────────────────────
class AdminReportsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        export_type = request.query_params.get('type')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="report_{export_type}.csv"'
        writer = csv.writer(response)

        if export_type == 'users':
            writer.writerow(['ID', 'Username', 'Email', 'Is Active', 'Is Staff', 'Date Joined'])
            for u in User.objects.all():
                writer.writerow([u.id, u.username, u.email, u.is_active, u.is_staff, u.date_joined])
        elif export_type == 'skills':
            writer.writerow(['ID', 'Name', 'Color', 'Target Tasks', 'Created At'])
            for s in Skill.objects.all():
                writer.writerow([s.id, s.name, s.color, s.target_tasks, s.created_at])
        elif export_type == 'tasks':
            writer.writerow(['ID', 'Title', 'Status', 'Skill ID', 'Created At'])
            for t in Task.objects.all():
                writer.writerow([t.id, t.title, t.status, t.skill_id, t.created_at])
        elif export_type == 'feedback':
            writer.writerow(['ID', 'Name', 'Email', 'Type', 'Message', 'Status', 'Created At'])
            for f in Feedback.objects.all():
                writer.writerow([f.id, f.name, f.email, f.feedback_type, f.message, f.status, f.created_at])
        else:
            return Response({"error": "Invalid export type"}, status=status.HTTP_400_BAD_REQUEST)

        log_activity(request, "CSV Report Exported", f"Downloaded report for {export_type}", "info")
        return response

# ─── LOGS ViewSet ────────────────────────────────────────────────────
class ActivityLogViewSet(viewsets.ModelViewSet):
    queryset = ActivityLog.objects.all().order_by('-created_at')
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(action__icontains=search) | Q(details__icontains=search))
        severity = self.request.query_params.get('severity')
        if severity:
            qs = qs.filter(severity=severity)
        return qs

# ─── ROLES ViewSet (Groups & Permissions) ────────────────────────────
class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().prefetch_related('permissions')
    serializer_class = GroupSerializer
    permission_classes = [IsAdminUser]

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.all().select_related('content_type').order_by('content_type__app_label', 'codename')
    serializer_class = PermissionSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None
