from rest_framework import serializers
from .models import User, Event, EventMessage, PrivateMessage, Notification, Interest

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'email', 'age', 'location', 'avatar_base64', 'interests', 'is_verified', 'last_seen']
        extra_kwargs = {'password': {'write_only': True}}

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # JS очікує avatarBase64 (camelCase)
        data['avatarBase64'] = data.pop('avatar_base64', None)
        return data

class EventSerializer(serializers.ModelSerializer):
    creatorId = serializers.ReadOnlyField(source='creator.id')
    participants = serializers.IntegerField(source='participants_limit')
    minParticipants = serializers.IntegerField(source='min_participants')
    currentParticipants = serializers.IntegerField(source='current_participants_count')
    date = serializers.DateTimeField(source='event_date', format="%Y-%m-%dT%H:%M")
    eventId = serializers.IntegerField(source='id', read_only=True)

    class Meta:
        model = Event
        fields = ['eventId', 'title', 'description', 'category', 'location', 'date', 
                  'participants', 'minParticipants', 'currentParticipants', 'creatorId', 
                  'interests', 'status']

class MessageSerializer(serializers.ModelSerializer):
    senderId = serializers.ReadOnlyField(source='sender.id')
    senderName = serializers.ReadOnlyField(source='sender.username')
    time = serializers.SerializerMethodField()
    timestamp = serializers.SerializerMethodField()

    class Meta:
        model = EventMessage
        fields = ['id', 'text', 'senderId', 'senderName', 'time', 'timestamp']

    def get_time(self, obj):
        return obj.created_at.strftime("%H:%M")
    
    def get_timestamp(self, obj):
        return obj.created_at.timestamp() * 1000