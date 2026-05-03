# backend/apps/players/urls.py
from django.urls import include, path
from .views import PlayerListAPIView
from .views import login_view

urlpatterns = [
    path('players/', PlayerListAPIView.as_view(), name='player-list'),#api route for players list
    path("api/login/", login_view),#login route
]
