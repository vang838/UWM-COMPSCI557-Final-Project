# backend/apps/players/views.py

from django.db.models import Prefetch

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action

from apps.players.models import Player
from apps.stats.models import PlayerSeasonStat
from apps.stats.stat_scope import (
    apply_stat_scope_filter,
    normalize_include_stats,
    normalize_stat_scope,
)
from apps.seasons.models import PlayerSeasonRoster, Season

from .serializers import (
    PlayerDashboardSerializer,
    PlayerSeasonBreakdownSerializer,
)


class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerDashboardSerializer
    lookup_field = "player_id"

    def get_queryset(self):
        queryset = Player.objects.select_related("team").all()

        team_id = (
            self.request.query_params.get("team")
            or self.request.query_params.get("team_id")
        )

        season_id = (
            self.request.query_params.get("season")
            or self.request.query_params.get("season_id")
        )

        season_year = (
            self.request.query_params.get("year")
            or self.request.query_params.get("season_year")
        )

        include_stats = normalize_include_stats(
            self.request.query_params.get("include_stats"),
            default="core",
        )

        stat_scope = normalize_stat_scope(
            self.request.query_params.get("stat_scope") or include_stats,
            default="core",
        )

        if team_id and season_year:
            queryset = queryset.filter(
                season_rosters__team_season__team_id=team_id,
                season_rosters__team_season__season__year=season_year,
            ).distinct()

        elif team_id and season_id:
            queryset = queryset.filter(
                season_rosters__team_season__team_id=team_id,
                season_rosters__team_season__season_id=season_id,
            ).distinct()

        elif season_year:
            queryset = queryset.filter(
                season_rosters__team_season__season__year=season_year,
            ).distinct()

        elif season_id:
            queryset = queryset.filter(
                season_rosters__team_season__season_id=season_id,
            ).distinct()

        elif team_id:
            queryset = queryset.filter(team_id=team_id)

        roster_queryset = PlayerSeasonRoster.objects.select_related(
            "team_season",
            "team_season__team",
            "team_season__season",
        )

        if team_id:
            roster_queryset = roster_queryset.filter(
                team_season__team_id=team_id,
            )

        if season_year:
            roster_queryset = roster_queryset.filter(
                team_season__season__year=season_year,
            )

        if season_id:
            roster_queryset = roster_queryset.filter(
                team_season__season_id=season_id,
            )

        if include_stats != "none":
            stats_queryset = PlayerSeasonStat.objects.select_related(
                "player_roster",
                "player_roster__player",
                "player_roster__team_season",
                "player_roster__team_season__team",
                "player_roster__team_season__season",
                "stat_type",
            )

            stats_queryset = apply_stat_scope_filter(
                queryset=stats_queryset,
                stat_scope=stat_scope,
                key_lookup="stat_type__key",
            )

            roster_queryset = roster_queryset.prefetch_related(
                Prefetch("stats", queryset=stats_queryset)
            )

        queryset = queryset.prefetch_related(
            Prefetch(
                "season_rosters",
                queryset=roster_queryset,
                to_attr="prefetched_matching_rosters",
            )
        )

        return queryset.order_by("last_name", "first_name")

    @action(detail=True, methods=["get"], url_path="season-stats")
    def season_stats(self, request, player_id=None):
        """
        Get a player's stats across seasons using the current PlayerSeasonRoster schema.
        """
        try:
            player = self.get_object()

            stat_scope = normalize_stat_scope(
                request.query_params.get("stat_scope"),
                default="core",
            )

            stats = (
                PlayerSeasonStat.objects.filter(
                    player_roster__player=player,
                )
                .select_related(
                    "player_roster",
                    "player_roster__player",
                    "player_roster__team_season",
                    "player_roster__team_season__team",
                    "player_roster__team_season__season",
                    "stat_type",
                )
            )

            team_id = request.query_params.get("team") or request.query_params.get("team_id")
            year = request.query_params.get("year") or request.query_params.get("season_year")
            season_id = request.query_params.get("season") or request.query_params.get("season_id")

            if team_id:
                stats = stats.filter(player_roster__team_season__team_id=team_id)

            if year:
                stats = stats.filter(player_roster__team_season__season__year=year)

            if season_id:
                stats = stats.filter(player_roster__team_season__season_id=season_id)

            stats = apply_stat_scope_filter(
                queryset=stats,
                stat_scope=stat_scope,
                key_lookup="stat_type__key",
            ).order_by(
                "player_roster__team_season__season__year",
                "stat_type__category",
                "stat_type__name",
            )

            serializer = PlayerSeasonBreakdownSerializer(stats, many=True)

            return Response(
                {
                    "player_id": player.player_id,
                    "first_name": player.first_name,
                    "last_name": player.last_name,
                    "stats": serializer.data,
                }
            )

        except Exception as error:
            return Response(
                {"error": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["get"], url_path="stats/season/(?P<season_id>[^/.]+)")
    def player_season_stats(self, request, player_id=None, season_id=None):
        """
        Get a specific player's stats for a specific season using PlayerSeasonRoster.
        """
        try:
            player = self.get_object()
            Season.objects.get(season_id=season_id)

            stat_scope = normalize_stat_scope(
                request.query_params.get("stat_scope"),
                default="core",
            )

            stats = (
                PlayerSeasonStat.objects.filter(
                    player_roster__player=player,
                    player_roster__team_season__season_id=season_id,
                )
                .select_related(
                    "player_roster",
                    "player_roster__player",
                    "player_roster__team_season",
                    "player_roster__team_season__team",
                    "player_roster__team_season__season",
                    "stat_type",
                )
            )

            stats = apply_stat_scope_filter(
                queryset=stats,
                stat_scope=stat_scope,
                key_lookup="stat_type__key",
            ).order_by("stat_type__category", "stat_type__name")

            serializer = PlayerSeasonBreakdownSerializer(stats, many=True)

            return Response(
                {
                    "player_id": player.player_id,
                    "first_name": player.first_name,
                    "last_name": player.last_name,
                    "season_id": season_id,
                    "stats": serializer.data,
                }
            )

        except Season.DoesNotExist:
            return Response(
                {"error": "Season not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        except Exception as error:
            return Response(
                {"error": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )