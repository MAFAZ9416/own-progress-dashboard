from django.apps import AppConfig


class AdminDashboardConfig(AppConfig):
    name = 'admin_dashboard'

    def ready(self):
        import admin_dashboard.signals
