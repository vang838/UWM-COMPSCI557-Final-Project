# backend/apps/stats/views.py

from rest_framework import viewsets

from apps.stats.models import StatType, PositionStatType, PlayerSeasonStat
from apps.stats.serializers import (
    StatTypeSerializer,
    PositionStatTypeSerializer,
    PlayerSeasonStatSerializer,
)
from apps.stats.stat_scope import apply_stat_scope_filter, normalize_stat_scope


class StatTypeViewSet(viewsets.ModelViewSet):
    serializer_class = StatTypeSerializer
    lookup_field = "stat_type_id"

    def get_queryset(self):
        queryset = StatType.objects.all()

        stat_scope = normalize_stat_scope(
            self.request.query_params.get("stat_scope"),
            default="all",
        )
        category = self.request.query_params.get("category")
        key = (
            self.request.query_params.get("key")
            or self.request.query_params.get("stat_key")
        )

        queryset = apply_stat_scope_filter(
            queryset=queryset,
            stat_scope=stat_scope,
            key_lookup="key",
        )

        if category:
            queryset = queryset.filter(category=category)

        if key:
            queryset = queryset.filter(key=key)

        return queryset.order_by("category", "name")


class PositionStatTypeViewSet(viewsets.ModelViewSet):
    serializer_class = PositionStatTypeSerializer

    def get_queryset(self):
        queryset = PositionStatType.objects.select_related("stat_type").all()

        position = self.request.query_params.get("position")
        primary = self.request.query_params.get("primary")
        category = self.request.query_params.get("category")
        stat_scope = normalize_stat_scope(
            self.request.query_params.get("stat_scope"),
            default="all",
        )

        queryset = apply_stat_scope_filter(
            queryset=queryset,
            stat_scope=stat_scope,
            key_lookup="stat_type__key",
        )

        if position:
            queryset = queryset.filter(position=position)

        if primary is not None:
            queryset = queryset.filter(is_primary=primary.lower() == "true")

        if category:
            queryset = queryset.filter(stat_type__category=category)

        return queryset.order_by("position", "display_order", "stat_type__name")


class PlayerSeasonStatViewSet(viewsets.ModelViewSet):
    serializer_class = PlayerSeasonStatSerializer
    lookup_field = "id"

    def get_queryset(self):
        queryset = (
            PlayerSeasonStat.objects.select_related(
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
        category = self.request.query_params.get("category")

        stat_key = (
            self.request.query_params.get("stat_key")
            or self.request.query_params.get("stat_type")
        )

        stat_scope = normalize_stat_scope(
            self.request.query_params.get("stat_scope"),
            default="core",
        )

        queryset = apply_stat_scope_filter(
            queryset=queryset,
            stat_scope=stat_scope,
            key_lookup="stat_type__key",
        )

        if player_id:
            queryset = queryset.filter(player_roster__player_id=player_id)

        if team_id:
            queryset = queryset.filter(player_roster__team_season__team_id=team_id)

        if year:
            queryset = queryset.filter(player_roster__team_season__season__year=year)

        if position:
            queryset = queryset.filter(player_roster__player__position=position)

        if category:
            queryset = queryset.filter(stat_type__category=category)

        if stat_key:
            queryset = queryset.filter(stat_type__key=stat_key)

        return queryset.order_by(
            "player_roster__player__last_name",
            "player_roster__player__first_name",
            "stat_type__category",
            "stat_type__name",
        )