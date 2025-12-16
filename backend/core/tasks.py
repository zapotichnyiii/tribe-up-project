import time
import threading
import asyncio
from datetime import timedelta
from django.utils import timezone
from .models import Event, Notification
from .sio import sio

def check_upcoming_events_loop():
    while True:
        try:
            now = timezone.now()
            start_window = now + timedelta(minutes=60)
            end_window = now + timedelta(minutes=61)

            # Знаходимо події, що почнуться через годину
            events = Event.objects.filter(event_date__gte=start_window, event_date__lt=end_window)

            for event in events:
                message_text = f"Нагадування: '{event.title}' через годину!"
                participants = event.participants.all()
                
                for user in participants:
                    # Створюємо повідомлення в БД
                    notif = Notification.objects.create(
                        user=user, type='reminder', message=message_text, related_id=event.id
                    )
                    
                    # Відправляємо Socket.IO подію
                    try:
                        asyncio.run(sio.emit('new_notification', {
                            'id': notif.id,
                            'message': notif.message, # JS використовує message
                            'type': notif.type,
                            'related_id': notif.related_id,
                            'created_at': notif.created_at.isoformat(),
                            'is_read': False
                        }, room=f"user_{user.id}"))
                    except Exception as e:
                        print(f"Socket emit error: {e}")

        except Exception as e:
            print(f"Scheduler Error: {e}")
        
        time.sleep(60)

def start_scheduler():
    t = threading.Thread(target=check_upcoming_events_loop, daemon=True)
    t.start()