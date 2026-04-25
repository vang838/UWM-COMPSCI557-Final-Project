from rest_framework import viewsets, generics
from rest_framework.utils import json

from apps.players.models import Player
from apps.players.serializers import PlayerSerializer
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# Create your views here.
class PlayerViewSet(viewsets.ModelViewSet):#api view for players list
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    lookup_field = "player_id"