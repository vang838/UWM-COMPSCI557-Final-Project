from rest_framework import viewsets
from apps.players.models import Player
from apps.players.serializers import PlayerSerializer

# Create your views here.
class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer