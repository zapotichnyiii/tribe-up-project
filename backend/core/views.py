from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.db.models import Q
import jwt
import datetime
import random
from .models import User, Event, Interest, Follower, EventMessage, PrivateMessage, Notification
from .serializers import UserSerializer, EventSerializer, MessageSerializer

# --- AUTH ---
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    data = request.data
    try:
        user = User.objects.create_user(
            username=data.get('username'),
            email=data.get('email'),
            password=data.get('password'),
            name=data.get('name'),
            age=data.get('age'),
            location=data.get('location'),
            interests=data.get('interests', []),
            avatar_base64=data.get('avatarBase64', ''),
            verification_code=str(random.randint(100000, 999999)),
            is_verified=False
        )
        # Тут би мала бути відправка пошти
        return Response({'userId': user.id, 'message': 'Code sent'}, status=201)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    try:
        user = User.objects.get(email=email)
        if user.check_password(password):
            if not user.is_verified:
                return Response({'error': 'Пошта не підтверджена', 'userId': user.id}, status=403)
            
            token = jwt.encode({
                'user_id': user.id,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
            }, settings.SECRET_KEY, algorithm='HS256')
            
            return Response({'user': UserSerializer(user).data, 'token': token})
    except User.DoesNotExist:
        pass
    return Response({'error': 'Невірна пошта або пароль'}, status=401)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    user_id = request.data.get('userId')
    code = request.data.get('code')
    try:
        user = User.objects.get(id=user_id)
        if user.verification_code == code:
            user.is_verified = True
            user.verification_code = None
            user.save()
            token = jwt.encode({'user_id': user.id, 'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)}, settings.SECRET_KEY, algorithm='HS256')
            return Response({'user': UserSerializer(user).data, 'token': token})
        return Response({'error': 'Невірний код'}, status=400)
    except User.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    return Response({'message': 'Simulated'}, status=200)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    return Response({'status': 'success'}, status=200)

# --- USERS ---
@api_view(['GET'])
@permission_classes([AllowAny])
def get_users(request):
    users = User.objects.filter(is_verified=True)
    return Response(UserSerializer(users, many=True).data)

@api_view(['GET'])
@permission_classes([AllowAny])
def search_users(request):
    query = request.GET.get('q', '').strip()
    if not query: return Response([])
    users = User.objects.filter(is_verified=True).filter(
        Q(username__icontains=query) | Q(name__icontains=query)
    )[:20]
    return Response(UserSerializer(users, many=True).data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user(request, user_id):
    if request.user.id != user_id:
        return Response({'error': 'Permission denied'}, status=403)
    
    user = request.user
    data = request.data
    user.name = data.get('name', user.name)
    user.username = data.get('username', user.username)
    user.age = data.get('age', user.age)
    user.location = data.get('location', user.location)
    user.interests = data.get('interests', user.interests)
    user.avatar_base64 = data.get('avatarBase64', user.avatar_base64)
    
    # Save interests to global list
    for interest in data.get('interests', []):
        Interest.objects.get_or_create(name=interest)
        
    user.save()
    return Response(UserSerializer(user).data)

@api_view(['GET'])
@permission_classes([AllowAny])
def user_social(request, user_id):
    followers = User.objects.filter(following_rel__followed_id=user_id, is_verified=True)
    following = User.objects.filter(followers_rel__follower_id=user_id, is_verified=True)
    
    def serialize_mini(qs):
        return [{'id': u.id, 'username': u.username, 'name': u.name, 'avatarBase64': u.avatar_base64} for u in qs]

    return Response({
        'followers': serialize_mini(followers),
        'following': serialize_mini(following)
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def follow_user(request, user_id):
    if request.user.id == user_id:
        return Response({'error': 'Self follow'}, status=400)
    Follower.objects.get_or_create(follower=request.user, followed_id=user_id)
    Notification.objects.create(
        user_id=user_id, type='follow', 
        message=f"@{request.user.username} підписався на вас", 
        related_id=request.user.id
    )
    return Response({'status': 'success'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unfollow_user(request, user_id):
    Follower.objects.filter(follower=request.user, followed_id=user_id).delete()
    return Response({'status': 'success'})

@api_view(['GET'])
def user_status(request, user_id):
    try:
        u = User.objects.get(id=user_id)
        # Реальний онлайн статус треба тягнути з sio.online_users, але для простоти повертаємо last_seen
        return Response({'isOnline': False, 'lastSeen': u.last_seen})
    except:
        return Response({})

# --- EVENTS ---
@api_view(['GET', 'POST'])
def events_list(request):
    if request.method == 'GET':
        status_param = request.GET.get('status', 'active')
        events = Event.objects.filter(status=status_param).order_by('-id')
        return Response(EventSerializer(events, many=True).data)
    
    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthorized'}, status=401)
        
        data = request.data
        for interest in data.get('interests', []):
            Interest.objects.get_or_create(name=interest)

        event = Event.objects.create(
            title=data['title'],
            description=data['description'],
            category=data['category'],
            location=data['location'],
            event_date=data['date'],
            participants_limit=data['participants'],
            min_participants=data.get('minParticipants', 0),
            creator=request.user,
            interests=data.get('interests', []),
            current_participants_count=1
        )
        event.participants.add(request.user)
        
        # Notify followers
        followers = User.objects.filter(following_rel__followed=request.user)
        for f in followers:
            Notification.objects.create(
                user=f, type='new_event',
                message=f"{request.user.username} створює нову подію: {data['title']}",
                related_id=event.id
            )
            
        return Response(EventSerializer(event).data, status=201)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def event_detail(request, event_id):
    try:
        event = Event.objects.get(pk=event_id)
    except Event.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if request.method == 'DELETE':
        event.delete()
        return Response({'status': 'success'})
    
    elif request.method == 'PUT':
        data = request.data
        event.title = data.get('title', event.title)
        event.description = data.get('description', event.description)
        event.category = data.get('category', event.category)
        event.location = data.get('location', event.location)
        event.event_date = data.get('date', event.event_date)
        event.participants_limit = data.get('participants', event.participants_limit)
        event.interests = data.get('interests', event.interests)
        event.save()
        return Response(EventSerializer(event).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_event(request):
    event_id = request.data.get('eventId')
    event = Event.objects.get(pk=event_id)
    if request.user not in event.participants.all():
        event.participants.add(request.user)
        event.current_participants_count += 1
        event.save()
    return Response({'status': 'success'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_event(request):
    event_id = request.data.get('eventId')
    event = Event.objects.get(pk=event_id)
    if request.user in event.participants.all():
        event.participants.remove(request.user)
        event.current_participants_count -= 1
        event.save()
    return Response({'status': 'success'})

@api_view(['GET'])
@permission_classes([AllowAny])
def my_joined_events(request, user_id):
    events = Event.objects.filter(participants__id=user_id)
    return Response([e.id for e in events])

@api_view(['GET'])
@permission_classes([AllowAny])
def event_participants(request, event_id):
    event = Event.objects.get(pk=event_id)
    users = event.participants.all()
    return Response(UserSerializer(users, many=True).data)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_interests(request):
    interests = Interest.objects.values_list('name', flat=True)
    return Response(list(interests))

# --- MESSAGES & NOTIFICATIONS ---
@api_view(['GET'])
def get_event_messages(request, event_id):
    msgs = EventMessage.objects.filter(event_id=event_id).order_by('created_at')
    return Response(MessageSerializer(msgs, many=True).data)

@api_view(['GET'])
def get_private_messages(request):
    u1 = request.GET.get('user1')
    u2 = request.GET.get('user2')
    msgs = PrivateMessage.objects.filter(
        Q(sender_id=u1, receiver_id=u2) | Q(sender_id=u2, receiver_id=u1)
    ).order_by('created_at')
    return Response(MessageSerializer(msgs, many=True).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request, user_id):
    notifs = Notification.objects.filter(user_id=user_id).order_by('-created_at')[:20]
    return Response(notifs.values())

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def read_notifications(request):
    if request.data.get('id'):
        Notification.objects.filter(id=request.data['id']).update(is_read=True)
    elif request.data.get('userId'):
        Notification.objects.filter(user_id=request.data['userId']).update(is_read=True)
    return Response({'status': 'success'})

@api_view(['GET'])
def get_my_chats(request, user_id):
    # Групуємо чати, знаходячи унікальних партнерів
    sent = PrivateMessage.objects.filter(sender_id=user_id).values_list('receiver_id', flat=True)
    received = PrivateMessage.objects.filter(receiver_id=user_id).values_list('sender_id', flat=True)
    partner_ids = set(list(sent) + list(received))
    
    chats = []
    for pid in partner_ids:
        partner = User.objects.get(id=pid)
        last_msg = PrivateMessage.objects.filter(
            Q(sender_id=user_id, receiver_id=pid) | Q(sender_id=pid, receiver_id=user_id)
        ).order_by('created_at').last()
        
        if last_msg:
            chats.append({
                'otherUser': {'id': partner.id, 'name': partner.name, 'username': partner.username, 'avatarBase64': partner.avatar_base64},
                'lastMessage': {'text': last_msg.text, 'timestamp': last_msg.created_at.timestamp() * 1000}
            })
            
    chats.sort(key=lambda x: x['lastMessage']['timestamp'], reverse=True)
    return Response(chats)