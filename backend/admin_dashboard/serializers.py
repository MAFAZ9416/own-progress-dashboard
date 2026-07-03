from rest_framework import serializers

class QuickActionInputSerializer(serializers.Serializer):
    ACTION_CHOICES = (
        ('backup', 'Database Backup'),
        ('report', 'System Report'),
        ('announcement', 'System Announcement'),
    )
    action_type = serializers.ChoiceField(choices=ACTION_CHOICES)
