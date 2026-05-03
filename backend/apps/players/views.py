from django.shortcuts import render
from django.urls import path
from rest_framework import generics
from apps.players.models import Player
from apps.players.serializers import PlayerSerializer
from rest_framework.generics import RetrieveAPIView
from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt



# Create your views here.
class PlayerListAPIView(generics.ListAPIView):#api view for players list
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer


class PlayerDetailAPIView(RetrieveAPIView):#api view for player details 
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    lookup_field = "player_id"


#login stuff
@csrf_exempt
def login_view(request):
    if request.method == "POST":
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")

        user = authenticate(username=username, password=password)

        if user is not None:
            return JsonResponse({"success": True})
        else:
            return JsonResponse({"success": False}, status=401)
