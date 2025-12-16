import os
import socketio
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tribeup_project.settings')

django_asgi_app = get_asgi_application()

# Імпортуємо sio сервер, який створимо в core/sio.py
from core.sio import sio

application = socketio.ASGIApp(sio, django_asgi_app)