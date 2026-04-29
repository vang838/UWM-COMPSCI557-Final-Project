from rest_framework import viewsets
from apps.seasons.models import Season, TeamSeason
from apps.seasons.serializers import SeasonSerializer, TeamSeasonSerializer

# Create your views here.
class SeasonViewSet(viewsets.ModelViewSet):
    queryset = Season.objects.all().order_by("year")
    serializer_class = SeasonSerializer
    lookup_field = "season_id"

class TeamSeasonViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSeasonSerializer
    lookup_field = "team_season_id"

    def get_queryset(self):
        queryset = TeamSeason.objects.select_related("team", "season").all()

        season_id = self.request.query_params.get("season")
        season_year = self.request.query_params.get("year")
        team_id = self.request.query_params.get("team")

        if season_id:
            queryset = queryset.filter(season_id=season_id)

        if season_year:
            queryset = queryset.filter(season__year=season_year)

        if team_id:
            queryset = queryset.filter(team_id=team_id)

        return queryset.order_by("season__year", "conference", "division", "team__team_name")