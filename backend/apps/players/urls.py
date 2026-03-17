# backend/apps/players/urls.py
from django.urls import path
from .views import PlayerListAPIView

urlpatterns = [
    path('players/', PlayerListAPIView.as_view(), name='player-list'),
]