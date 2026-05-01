from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.players.models import Player
from apps.seasons.models import TeamSeason
from apps.reports.services import get_player_comparison_report


class PlayerComparisonReportView(APIView):
    """
    SQL-backed report endpoint.

    Example:
    /api/reports/player-comparison/?left_player=1&right_player=2&team=23&year=2024
    """

    def get(self, request):
        left_player = request.query_params.get("left_player")
        right_player = request.query_params.get("right_player")
        team = request.query_params.get("team") or request.query_params.get("team_id")
        year = request.query_params.get("year") or request.query_params.get("season_year")

        missing_params = []

        if not left_player:
            missing_params.append("left_player")

        if not right_player:
            missing_params.append("right_player")

        if not team:
            missing_params.append("team")

        if not year:
            missing_params.append("year")

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
            left_player_id = int(left_player)
            right_player_id = int(right_player)
            team_id = int(team)
            season_year = int(year)
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

        if not Player.objects.filter(player_id=left_player_id).exists():
            return Response(
                {
                    "error": f"Left player with id {left_player_id} was not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if not Player.objects.filter(player_id=right_player_id).exists():
            return Response(
                {
                    "error": f"Right player with id {right_player_id} was not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if not TeamSeason.objects.filter(
            team_id=team_id,
            season__year=season_year,
        ).exists():
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