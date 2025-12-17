from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/register/', views.register),
    path('auth/login/', views.login_view),
    path('auth/verify/', views.verify_email),
    path('auth/forgot-password/', views.forgot_password), # Заглушка
    path('auth/reset-password/', views.reset_password),   # Заглушка
    # Users
    path('users/', views.get_users),
    path('users/search/', views.search_users),
    path('users/<int:user_id>/', views.update_user),
    path('users/<int:user_id>/social/', views.user_social),
    path('users/<int:user_id>/follow/', views.follow_user),
    path('users/<int:user_id>/unfollow/', views.unfollow_user),
    path('users/<int:user_id>/status/', views.user_status),

    # Events
    path('events/', views.events_list),
    path('events/<int:event_id>/', views.event_detail),
    path('events/join/', views.join_event),
    path('events/leave/', views.leave_event),
    path('events/<int:event_id>/participants/', views.event_participants),
    path('my-joined-events/<int:user_id>/', views.my_joined_events),

    # Interests
    path('interests/', views.get_interests),

    # Messages
    path('messages/event/<int:event_id>/', views.get_event_messages),
    path('messages/private/', views.get_private_messages),
    path('my-chats/<int:user_id>/', views.get_my_chats),

    # Notifications
    path('notifications/<int:user_id>/', views.get_notifications),
    path('notifications/read/', views.read_notifications),
]