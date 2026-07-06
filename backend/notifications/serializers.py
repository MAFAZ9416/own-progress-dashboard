from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='notification_type', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'title',
            'message',
            'type',
            'notification_type',
            'metadata',
            'is_read',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields
