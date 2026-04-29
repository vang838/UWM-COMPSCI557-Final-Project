from rest_framework import viewsets
from apps.seasons.models import Season, TeamSeason, PlayerSeasonRoster
from apps.seasons.serializers import SeasonSerializer, TeamSeasonSerializer, PlayerSeasonRosterSerializer

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

class PlayerSeasonRosterViewSet(viewsets.ModelViewSet):
    serializer_class = PlayerSeasonRosterSerializer
    lookup_field = "roster_id"

    def get_queryset(self):
        queryset = (
            PlayerSeasonRoster.objects
            .select_related(
                "player",
                "team_season",
                "team_season__team",
                "team_season__season",
            )
            .all()
        )

        team_id = self.request.query_params.get("team")
        season_id = self.request.query_params.get("season")
        season_year = self.request.query_params.get("year")
        team_season_id = self.request.query_params.get("team_season")
        player_id = self.request.query_params.get("player")
        active = self.request.query_params.get("active")

        if team_id:
            queryset = queryset.filter(team_season__team_id=team_id)

        if season_id:
            queryset = queryset.filter(team_season__season_id=season_id)

        if season_year:
            queryset = queryset.filter(team_season__season__year=season_year)

        if team_season_id:
            queryset = queryset.filter(team_season_id=team_season_id)

        if player_id:
            queryset = queryset.filter(player_id=player_id)

        if active is not None:
            queryset = queryset.filter(is_active=active.lower() == "true")

        return queryset.order_by(
            "team_season__season__year",
            "team_season__team__team_name",
            "player__last_name",
            "player__first_name",
        )