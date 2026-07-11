from django.urls import path
from .views import PushSubscribeView, PushUnsubscribeView, PushStatusView

urlpatterns = [
    path('subscribe/', PushSubscribeView.as_view(), name='push-subscribe'),
    path('unsubscribe/', PushUnsubscribeView.as_view(), name='push-unsubscribe'),
    path('status/', PushStatusView.as_view(), name='push-status'),
]
