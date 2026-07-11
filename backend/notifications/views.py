from django.shortcuts import get_object_or_404

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk, user=request.user)
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=['is_read', 'updated_at'])
        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationMarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read.'}, status=status.HTTP_200_OK)


class NotificationDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        notification = get_object_or_404(Notification, pk=pk, user=request.user)
        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


from .models import PushSubscription
from .push_service import VAPID_PUBLIC_KEY

class PushSubscribeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        endpoint = request.data.get('endpoint')
        keys = request.data.get('keys', {})
        p256dh = keys.get('p256dh')
        auth = keys.get('auth')

        if not endpoint or not p256dh or not auth:
            return Response({'error': 'endpoint, p256dh, and auth are required'}, status=status.HTTP_400_BAD_REQUEST)

        subscription, created = PushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={
                'user': request.user,
                'p256dh': p256dh,
                'auth': auth,
                'browser_name': request.data.get('browser_name'),
                'browser_version': request.data.get('browser_version'),
                'platform': request.data.get('platform'),
                'user_agent': request.data.get('user_agent'),
            }
        )
        return Response({'message': 'Subscribed successfully'}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class PushUnsubscribeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        endpoint = request.data.get('endpoint')
        if not endpoint:
            return Response({'error': 'endpoint is required'}, status=status.HTTP_400_BAD_REQUEST)

        deleted, _ = PushSubscription.objects.filter(endpoint=endpoint, user=request.user).delete()
        if deleted:
            return Response({'message': 'Unsubscribed successfully'}, status=status.HTTP_200_OK)
        return Response({'error': 'Subscription not found'}, status=status.HTTP_404_NOT_FOUND)


class PushStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        endpoint = request.query_params.get('endpoint')
        subscribed = False
        if endpoint:
            subscribed = PushSubscription.objects.filter(endpoint=endpoint, user=request.user).exists()
        return Response({
            'subscribed': subscribed,
            'public_key': VAPID_PUBLIC_KEY
        }, status=status.HTTP_200_OK)
