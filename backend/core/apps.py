from django.apps import AppConfig
import os

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        from . import tasks
        # Запускаємо тільки в процесі runserver, щоб не дублювати
        if os.environ.get('RUN_MAIN', None) == 'true':
            tasks.start_scheduler()