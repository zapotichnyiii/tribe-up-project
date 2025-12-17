from django.apps import AppConfig
import os

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        from .tasks import start_scheduler
        if os.environ.get('RUN_MAIN') == 'true':
            start_scheduler()
        pass