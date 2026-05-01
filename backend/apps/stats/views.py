from rest_framework import viewsets

from apps.stats.models import StatType, PositionStatType, PlayerSeasonStat
from apps.stats.serializers import (
    StatTypeSerializer,
    PositionStatTypeSerializer,
    PlayerSeasonStatSerializer,
)


class StatTypeViewSet(viewsets.ModelViewSet):
    queryset = StatType.objects.all().order_by("category", "name")
    serializer_class = StatTypeSerializer
    lookup_field = "stat_type_id"


class PositionStatTypeViewSet(viewsets.ModelViewSet):
    serializer_class = PositionStatTypeSerializer

    def get_queryset(self):
        queryset = PositionStatType.objects.select_related("stat_type").all()

        position = self.request.query_params.get("position")
        primary = self.request.query_params.get("primary")

        if position:
            queryset = queryset.filter(position=position)

        if primary is not None:
            queryset = queryset.filter(is_primary=primary.lower() == "true")

        return queryset.order_by("position", "display_order")


class PlayerSeasonStatViewSet(viewsets.ModelViewSet):
    serializer_class = PlayerSeasonStatSerializer
    lookup_field = "id"

    def get_queryset(self):
        queryset = (
            PlayerSeasonStat.objects
            .select_related(
                "player_roster",
                "player_roster__player",
                "player_roster__team_season",
                "player_roster__team_season__team",
                "player_roster__team_season__season",
                "stat_type",
            )
            .all()
        )

        player_id = self.request.query_params.get("player")
        team_id = self.request.query_params.get("team")
        year = self.request.query_params.get("year")
        position = self.request.query_params.get("position")
        stat_type = self.request.query_params.get("stat_type")

        if player_id:
            queryset = queryset.filter(player_roster__player_id=player_id)

        if team_id:
            queryset = queryset.filter(player_roster__team_season__team_id=team_id)

        if year:
            queryset = queryset.filter(player_roster__team_season__season__year=year)

        if position:
            queryset = queryset.filter(player_roster__player__position=position)

        if stat_type:
            queryset = queryset.filter(stat_type__key=stat_type)

        return queryset.order_by(
            "player_roster__player__last_name",
            "stat_type__category",
            "stat_type__name",
        )