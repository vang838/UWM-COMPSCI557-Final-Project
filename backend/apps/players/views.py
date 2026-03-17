from django.shortcuts import render
from django.urls import path
from rest_framework import generics
from apps.players.models import Player
from apps.players.serializers import PlayerSerializer

# Create your views here.
class PlayerListAPIView(generics.ListAPIView):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer