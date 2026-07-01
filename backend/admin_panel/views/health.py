import psutil
from django.conf import settings
from django.db import connection
from django.core.mail import get_connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

class SystemHealthView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        db_status = "Healthy"
        try:
            connection.ensure_connection()
        except Exception:
            db_status = "Unreachable"

        smtp_status = "Healthy"
        try:
            smtp_conn = get_connection()
            smtp_conn.open()
            smtp_conn.close()
        except Exception:
            smtp_status = "Configuration Error/Unreachable"

        cpu_usage = 0.0
        mem_usage = 0.0
        disk_usage = 0.0
        try:
            cpu_usage = psutil.cpu_percent(interval=None)
            mem = psutil.virtual_memory()
            mem_usage = mem.percent
            disk = psutil.disk_usage('/')
            disk_usage = disk.percent
        except Exception:
            pass

        score = 100
        if db_status != "Healthy":
            score -= 40
        if smtp_status != "Healthy":
            score -= 20
        if cpu_usage > 85.0:
            score -= 10
        if mem_usage > 90.0:
            score -= 15

        return Response({
            "database_status": db_status,
            "api_status": "Healthy",
            "smtp_status": smtp_status,
            "health_score": max(score, 0),
            "environment": "Production" if not settings.DEBUG else "Development",
            "cpu_usage_pct": cpu_usage,
            "memory_usage_pct": mem_usage,
            "disk_usage_pct": disk_usage,
            "server_uptime": "N/A"
        })
