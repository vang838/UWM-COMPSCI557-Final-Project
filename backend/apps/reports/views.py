# backend/apps/reports/views.py

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.players.models import Player
from apps.seasons.models import TeamSeason
from apps.reports.services import get_player_comparison_report


def get_required_query_params(request, required_params):
    missing_params = []
    values = {}

    for param_name, aliases in required_params.items():
        value = None

        for alias in aliases:
            value = request.query_params.get(alias)

            if value:
                break

        if not value:
            missing_params.append(param_name)
        else:
            values[param_name] = value

    return values, missing_params


class PlayerComparisonReportView(APIView):
    """
    SQL-backed report endpoint.

    Example:
    /api/reports/player-comparison/?left_player=1&right_player=2&team=23&year=2024
    """

    def get(self, request):
        query_values, missing_params = get_required_query_params(
            request,
            {
                "left_player": ["left_player"],
                "right_player": ["right_player"],
                "team": ["team", "team_id"],
                "year": ["year", "season_year"],
            },
        )

        if missing_params:
            return Response(
                {
                    "error": "Missing required query parameters.",
                    "missing": missing_params,
                    "example": "/api/reports/player-comparison/?left_player=1&right_player=2&team=23&year=2024",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            left_player_id = int(query_values["left_player"])
            right_player_id = int(query_values["right_player"])
            team_id = int(query_values["team"])
            season_year = int(query_values["year"])
        except ValueError:
            return Response(
                {
                    "error": "left_player, right_player, team, and year must be integers."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if left_player_id == right_player_id:
            return Response(
                {
                    "error": "left_player and right_player must be different players."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_player_ids = set(
            Player.objects.filter(
                player_id__in=[left_player_id, right_player_id]
            ).values_list("player_id", flat=True)
        )

        if left_player_id not in existing_player_ids:
            return Response(
                {
                    "error": f"Left player with id {left_player_id} was not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if right_player_id not in existing_player_ids:
            return Response(
                {
                    "error": f"Right player with id {right_player_id} was not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        team_season_exists = TeamSeason.objects.filter(
            team_id=team_id,
            season__year=season_year,
        ).exists()

        if not team_season_exists:
            return Response(
                {
                    "error": f"No team-season record found for team {team_id} and year {season_year}."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            report = get_player_comparison_report(
                left_player_id=left_player_id,
                right_player_id=right_player_id,
                team_id=team_id,
                year=season_year,
            )

            return Response(report)

        except Exception as error:
            return Response(
                {
                    "error": "Failed to generate player comparison report.",
                    "details": str(error),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )