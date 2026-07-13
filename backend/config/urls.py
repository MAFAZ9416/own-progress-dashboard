from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from django.http import JsonResponse

from users.views import EmailTokenObtainPairView

def health(request):
    return JsonResponse({
        "status": "online",
        "app": "Progressly API"
    })

urlpatterns = [
    path("", health),
    path("admin/", admin.site.urls),
    path("api/users/", include("users.urls")),
    path("api/token/", EmailTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/skills/", include("skills.urls")),
    path("api/tasks/", include("tasks.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/push/", include("notifications.push_urls")),
    path("api/dashboard/", include("analytics.urls")),
    path("api/admin/", include("admin_dashboard.urls")),
]

# Serve media files in local development using Django's serve view.
# We check RENDER is not set (i.e. not on Render production) to serve locally.
# We do NOT use Django's static() helper because it requires DEBUG=True.
import os as _os
if not _os.getenv("RENDER"):
    from django.urls import re_path
    from django.views.static import serve
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]
