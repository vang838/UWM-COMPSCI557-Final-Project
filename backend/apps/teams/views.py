from rest_framework import viewsets
from apps.teams.models import Team
from apps.teams.serializers import TeamSerializer

# Create your views here.
class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all().order_by("team_name")
    serializer_class = TeamSerializer
    lookup_field = "team_id"