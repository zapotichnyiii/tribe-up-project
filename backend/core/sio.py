import socketio
import asyncio

from core.models import User, Event, EventMessage, PrivateMessage

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

online_users = {}

@sio.event
async def connect(sid, environ):
    pass

@sio.event
async def disconnect(sid):
    # Видалення користувача зі списку онлайн
    user_id_to_remove = None
    for uid, sids in online_users.items():
        if sid in sids:
            sids.remove(sid)
            if not sids: user_id_to_remove = uid
            break
    if user_id_to_remove:
        del online_users[user_id_to_remove]

@sio.event
async def join_notifications(sid, data):
    user_id = data.get('userId')
    if user_id:
        await sio.enter_room(sid, f"user_{user_id}")
        if user_id not in online_users:
            online_users[user_id] = set()
        online_users[user_id].add(sid)

@sio.event
async def join(sid, data):
    room = data.get('room')
    if room:
        await sio.enter_room(sid, room)

@sio.event
async def send_event_message(sid, data):
    from asgiref.sync import sync_to_async
    
    @sync_to_async
    def create_msg():
        sender = User.objects.get(id=data['senderId'])
        event = Event.objects.get(id=data['eventId'])
        msg = EventMessage.objects.create(event=event, sender=sender, text=data['text'])
        return {
            'id': msg.id,
            'text': msg.text,
            'senderId': sender.id,
            'senderName': sender.username,
            'time': msg.created_at.strftime("%H:%M"),
            'timestamp': msg.created_at.timestamp() * 1000
        }

    msg_data = await create_msg()
    await sio.emit('receive_message', msg_data, room=f"event_{data['eventId']}")

@sio.event
async def send_private_message(sid, data):
    from asgiref.sync import sync_to_async

    @sync_to_async
    def create_priv_msg():
        sender = User.objects.get(id=data['senderId'])
        receiver = User.objects.get(id=data['receiverId'])
        msg = PrivateMessage.objects.create(sender=sender, receiver=receiver, text=data['text'])
        return {
            'msg_data': {
                'id': msg.id,
                'text': msg.text,
                'senderId': sender.id,
                'senderName': sender.username,
                'time': msg.created_at.strftime("%H:%M"),
                'timestamp': msg.created_at.timestamp() * 1000
            },
            'receiver_id': receiver.id
        }

    res = await create_priv_msg()
    msg_data = res['msg_data']
    
    u1, u2 = sorted([int(data['senderId']), int(data['receiverId'])])
    room = f"private_{u1}_{u2}"
    
    await sio.emit('receive_private_message', msg_data, room=room)
    await sio.emit('chat_alert', msg_data, room=f"user_{res['receiver_id']}")