import datetime
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from django.db.models import Avg, Max
from skills.models import Skill
from tasks.models import Task, TaskCompletion
from admin_panel.models import Feedback, EmailLog

User = get_user_model()

class AdminDashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.now().date()
        
        # User metrics
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        online_users = User.objects.filter(login_history__is_active_session=True).distinct().count()
        
        # Registration details
        new_users_today = User.objects.filter(date_joined__date=today).count()
        new_users_weekly = User.objects.filter(date_joined__date__gte=today - datetime.timedelta(days=7)).count()
        new_users_monthly = User.objects.filter(date_joined__date__gte=today - datetime.timedelta(days=30)).count()

        # Growth Percentage
        previous_users = User.objects.filter(date_joined__date__lt=today - datetime.timedelta(days=7)).count()
        if previous_users > 0:
            user_growth_pct = round(((total_users - previous_users) / previous_users) * 100, 1)
        else:
            user_growth_pct = 100.0

        # Tasks metrics
        total_tasks = Task.objects.count()
        pending_tasks = Task.objects.filter(status='pending').count()
        completed_tasks = Task.objects.filter(status='completed').count()
        overdue_tasks = Task.objects.filter(status='pending', created_at__date__lt=today).count()
        completion_rate = round((completed_tasks / total_tasks * 100) if total_tasks else 0, 1)

        # Skills metrics
        total_skills = Skill.objects.count()
        
        # Calculations: Average Skill Progress
        skills = Skill.objects.prefetch_related('tasks')
        total_progress = 0
        for s in skills:
            t_count = s.tasks.count()
            c_count = s.tasks.filter(status='completed').count()
            if t_count > 0:
                total_progress += min(round((c_count / t_count) * 100, 2), 100)
        avg_progress = round(total_progress / total_skills, 1) if total_skills else 0.0
        
        completed_skills = 0
        for s in skills:
            t_count = s.tasks.count()
            c_count = s.tasks.filter(status='completed').count()
            if t_count > 0 and t_count == c_count:
                completed_skills += 1
        
        skills_growth = round(Skill.objects.filter(created_at__date__gte=today - datetime.timedelta(days=7)).count())

        # Streaks metrics
        streak_stats = User.objects.aggregate(avg_current=Avg('streak__current_streak'), max_longest=Max('streak__longest_streak'))
        avg_current_streak = round(streak_stats.get('avg_current') or 0.0, 1)
        longest_streak = streak_stats.get('max_longest') or 0

        # Feedback metrics
        total_feedback = Feedback.objects.count()
        pending_feedback = Feedback.objects.filter(status='pending').count()
        resolved_feedback = Feedback.objects.filter(status='resolved').count()

        # Email metrics
        total_emails = EmailLog.objects.count()
        failed_emails = EmailLog.objects.filter(status='failed').count()
        delivered_emails = EmailLog.objects.filter(status='delivered').count()

        # Chart datasets (registrations over past 7 days)
        registration_chart = []
        for i in range(7):
            day = today - datetime.timedelta(days=i)
            count = User.objects.filter(date_joined__date=day).count()
            registration_chart.append({
                "date": day.strftime("%b %d"),
                "count": count
            })
        registration_chart.reverse()

        # Task completions over past 7 days
        completion_chart = []
        for i in range(7):
            day = today - datetime.timedelta(days=i)
            count = TaskCompletion.objects.filter(completed_date=day).count()
            completion_chart.append({
                "date": day.strftime("%b %d"),
                "completions": count
            })
        completion_chart.reverse()

        # Task completions over past 60 days for streak heatmap
        streak_heatmap = []
        for i in range(60):
            day = today - datetime.timedelta(days=i)
            count = TaskCompletion.objects.filter(completed_date=day).count()
            streak_heatmap.append({
                "date": day.strftime("%Y-%m-%d"),
                "count": count
            })
        streak_heatmap.reverse()

        return Response({
            "users": {
                "total": total_users,
                "active": active_users,
                "online": online_users,
                "new_today": new_users_today,
                "weekly": new_users_weekly,
                "monthly": new_users_monthly,
                "growth_pct": user_growth_pct
            },
            "tasks": {
                "total": total_tasks,
                "pending": pending_tasks,
                "completed": completed_tasks,
                "overdue": overdue_tasks,
                "completion_rate": completion_rate
            },
            "skills": {
                "total": total_skills,
                "average_progress": avg_progress,
                "completed_skills": completed_skills,
                "growth": skills_growth
            },
            "streaks": {
                "average_streak": avg_current_streak,
                "longest_streak": longest_streak
            },
            "feedback": {
                "total": total_feedback,
                "pending": pending_feedback,
                "resolved": resolved_feedback
            },
            "emails": {
                "total": total_emails,
                "failed": failed_emails,
                "delivered": delivered_emails
            },
            "charts": {
                "registrations": registration_chart,
                "completions": completion_chart,
                "streak_heatmap": streak_heatmap
            }
        })
