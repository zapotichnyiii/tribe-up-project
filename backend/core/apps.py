from django.apps import AppConfig
import os

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        # Імпортуємо всередині методу, щоб уникнути помилок циклічного імпорту
        from .tasks import start_scheduler
        
        # Перевіряємо RUN_MAIN, щоб не запускати планувальник двічі (через auto-reloader Django)
        if os.environ.get('RUN_MAIN') == 'true':
            start_scheduler()
            print("--- Scheduler started in background thread ---")