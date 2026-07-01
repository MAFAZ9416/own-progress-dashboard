"""
Measure Django ORM query counts for hot endpoints.
Run: python manage.py shell < benchmark_queries.py
Or:  python benchmark_queries.py (standalone)
"""
import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from datetime import timedelta
from django.contrib.auth import get_user_model
from django.db import connection, reset_queries
from django.test import RequestFactory
from django.utils import timezone
from rest_framework.test import force_authenticate

from analytics.views import DashboardSummaryView, MonthlyAnalyticsView
from skills.models import Skill
from skills.views import SkillViewSet
from tasks.models import Task, TaskCompletion
from tasks.views import TaskViewSet
from users.serializers import EmailTokenObtainPairSerializer, ForgotPasswordSerializer, ResetPasswordSerializer
from users.models import PasswordResetToken

User = get_user_model()


def count_queries(fn):
    reset_queries()
    result = fn()
    return len(connection.queries), result


def setup_benchmark_user(num_skills=5, tasks_per_skill=4):
    user = User.objects.create_user(
        username=f"bench_{timezone.now().timestamp()}",
        email=f"bench_{timezone.now().timestamp()}@example.com",
        password="testpassword123",
    )
    today = timezone.now().date()
    for i in range(num_skills):
        skill = Skill.objects.create(user=user, name=f"Skill {i}", target_tasks=10)
        for j in range(tasks_per_skill):
            status = "completed" if j % 2 == 0 else "pending"
            task = Task.objects.create(
                user=user, skill=skill, title=f"Task {i}-{j}", status=status
            )
            if status == "completed":
                TaskCompletion.objects.create(task=task, user=user, skill=skill)
                TaskCompletion.objects.filter(pk=TaskCompletion.objects.latest("pk").pk).update(
                    completed_date=today - timedelta(days=j)
                )
    return user


def benchmark_dashboard(user):
    factory = RequestFactory()
    request = factory.get("/api/analytics/dashboard/")
    force_authenticate(request, user=user)
    view = DashboardSummaryView.as_view()
    return count_queries(lambda: view(request))


def benchmark_skills_list(user):
    factory = RequestFactory()
    request = factory.get("/api/skills/")
    force_authenticate(request, user=user)
    view = SkillViewSet.as_view({"get": "list"})
    return count_queries(lambda: view(request))


def benchmark_tasks_list(user):
    factory = RequestFactory()
    request = factory.get("/api/tasks/")
    force_authenticate(request, user=user)
    view = TaskViewSet.as_view({"get": "list"})
    return count_queries(lambda: view(request))


def benchmark_monthly(user):
    factory = RequestFactory()
    request = factory.get("/api/analytics/monthly/")
    force_authenticate(request, user=user)
    view = MonthlyAnalyticsView.as_view()
    return count_queries(lambda: view(request))


def benchmark_login(user):
    serializer = EmailTokenObtainPairSerializer(
        data={"email": user.email, "password": "testpassword123"},
        context={"request": None},
    )
    return count_queries(lambda: serializer.is_valid())


def benchmark_forgot_password(user):
    serializer = ForgotPasswordSerializer(data={"email": user.email})
    return count_queries(lambda: serializer.is_valid())


def benchmark_reset_password(user):
    token = PasswordResetToken.generate_token(user)
    serializer = ResetPasswordSerializer(
        data={"token": token.token, "password": "newpass123!", "confirm_password": "newpass123!"}
    )
    return count_queries(lambda: serializer.is_valid())


def run_benchmarks():
    user = setup_benchmark_user()
    results = {}
    for name, fn in [
        ("dashboard_summary", lambda: benchmark_dashboard(user)),
        ("skills_list", lambda: benchmark_skills_list(user)),
        ("tasks_list", lambda: benchmark_tasks_list(user)),
        ("monthly_analytics", lambda: benchmark_monthly(user)),
        ("login", lambda: benchmark_login(user)),
        ("forgot_password", lambda: benchmark_forgot_password(user)),
        ("reset_password_validate", lambda: benchmark_reset_password(user)),
    ]:
        count, _ = fn()
        results[name] = count
        print(f"{name}: {count} queries")
    user.delete()
    return results


if __name__ == "__main__":
    run_benchmarks()
