from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    name = models.CharField(max_length=255)
    age = models.IntegerField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    avatar_base64 = models.TextField(blank=True, null=True)
    interests = models.JSONField(default=list, blank=True)
    is_verified = models.BooleanField(default=False)
    verification_code = models.CharField(max_length=6, blank=True, null=True)
    last_seen = models.DateTimeField(auto_now=True)

    groups = models.ManyToManyField('auth.Group', related_name='core_user_groups', blank=True)
    user_permissions = models.ManyToManyField('auth.Permission', related_name='core_user_permissions', blank=True)

class Interest(models.Model):
    name = models.CharField(max_length=100, unique=True)

class Event(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50)
    location = models.CharField(max_length=255)
    event_date = models.DateTimeField()
    participants_limit = models.IntegerField(default=10)
    min_participants = models.IntegerField(default=0)
    current_participants_count = models.IntegerField(default=1)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_events')
    interests = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    
    participants = models.ManyToManyField(User, related_name='joined_events', blank=True)

class EventMessage(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class PrivateMessage(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50)
    message = models.TextField()
    related_id = models.IntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class Follower(models.Model):
    follower = models.ForeignKey(User, related_name='following_rel', on_delete=models.CASCADE)
    followed = models.ForeignKey(User, related_name='followers_rel', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('follower', 'followed')