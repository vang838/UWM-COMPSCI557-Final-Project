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


def get_player_filter_params(request):
    return {
        "team_id": request.query_params.get("team")
        or request.query_params.get("team_id"),
        "season_id": request.query_params.get("season")
        or request.query_params.get("season_id"),
        "season_year": request.query_params.get("year")
        or request.query_params.get("season_year"),
    }


class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerDashboardSerializer
    lookup_field = "player_id"

    def get_queryset(self):
        """
        List/retrieve endpoint:
        - include_stats=none keeps /api/players/ lightweight.
        - include_stats=core/advanced/all prefetches only matching roster stats.
        - Custom stat actions use their own targeted queries, so they get a lightweight
          player queryset here.
        """
        queryset = Player.objects.select_related("team").all()

        if self.action in {"season_stats", "player_season_stats"}:
            return queryset.order_by("last_name", "first_name")

        params = get_player_filter_params(self.request)
        team_id = params["team_id"]
        season_id = params["season_id"]
        season_year = params["season_year"]

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
            queryset = queryset.filter(
                season_rosters__team_season__team_id=team_id,
            ).distinct()

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

        return queryset.distinct().order_by("last_name", "first_name")

    def get_lightweight_player(self):
        return (
            Player.objects.select_related("team")
            .only(
                "player_id",
                "first_name",
                "last_name",
                "position",
                "team_id",
                "date_of_birth",
                "college",
                "height",
                "weight",
                "headshot_url",
                "is_active",
            )
            .get(player_id=self.kwargs.get(self.lookup_field))
        )

    @action(detail=True, methods=["get"], url_path="season-stats")
    def season_stats(self, request, player_id=None):
        """
        Get a player's stats across seasons using the current PlayerSeasonRoster schema.
        Used by the player detail modal.
        """
        try:
            player = self.get_lightweight_player()

            stat_scope = normalize_stat_scope(
                request.query_params.get("stat_scope"),
                default="core",
            )

            params = get_player_filter_params(request)
            team_id = params["team_id"]
            year = params["season_year"]
            season_id = params["season_id"]

            stats = PlayerSeasonStat.objects.filter(
                player_roster__player_id=player.player_id,
            ).select_related(
                "player_roster",
                "player_roster__player",
                "player_roster__team_season",
                "player_roster__team_season__team",
                "player_roster__team_season__season",
                "stat_type",
            )

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
                    "position": player.position,
                    "date_of_birth": player.date_of_birth,
                    "age": player.age,
                    "college": player.college,
                    "height": player.height,
                    "weight": player.weight,
                    "headshot_url": player.headshot_url,
                    "stats": serializer.data,
                }
            )

        except Player.DoesNotExist:
            return Response(
                {"error": "Player not found"},
                status=status.HTTP_404_NOT_FOUND,
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
            player = self.get_lightweight_player()

            if not Season.objects.filter(season_id=season_id).exists():
                return Response(
                    {"error": "Season not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            stat_scope = normalize_stat_scope(
                request.query_params.get("stat_scope"),
                default="core",
            )

            stats = PlayerSeasonStat.objects.filter(
                player_roster__player_id=player.player_id,
                player_roster__team_season__season_id=season_id,
            ).select_related(
                "player_roster",
                "player_roster__player",
                "player_roster__team_season",
                "player_roster__team_season__team",
                "player_roster__team_season__season",
                "stat_type",
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

        except Player.DoesNotExist:
            return Response(
                {"error": "Player not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        except Exception as error:
            return Response(
                {"error": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )