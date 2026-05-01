from django.db.models import Q
from rest_framework import viewsets

from apps.teams.models import Team, Coach, CoachSeasonAssignment
from apps.teams.serializers import (
    TeamSerializer,
    CoachSerializer,
    CoachSeasonAssignmentSerializer,
)


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all().order_by("team_name")
    serializer_class = TeamSerializer
    lookup_field = "team_id"


class CoachViewSet(viewsets.ModelViewSet):
    serializer_class = CoachSerializer
    lookup_field = "coach_id"

    def get_queryset(self):
        queryset = Coach.objects.select_related("team").prefetch_related(
            "season_assignments",
            "season_assignments__team_season",
            "season_assignments__team_season__team",
            "season_assignments__team_season__season",
        )

        team_id = (
            self.request.query_params.get("team")
            or self.request.query_params.get("team_id")
        )

        season_id = (
            self.request.query_params.get("season")
            or self.request.query_params.get("season_id")
        )

        year = (
            self.request.query_params.get("year")
            or self.request.query_params.get("season_year")
        )

        if team_id and year:
            queryset = queryset.filter(
                season_assignments__team_season__team_id=team_id,
                season_assignments__team_season__season__year=year,
            )

        elif team_id and season_id:
            queryset = queryset.filter(
                season_assignments__team_season__team_id=team_id,
                season_assignments__team_season__season_id=season_id,
            )

        elif year:
            queryset = queryset.filter(
                season_assignments__team_season__season__year=year,
            )

        elif season_id:
            queryset = queryset.filter(
                season_assignments__team_season__season_id=season_id,
            )

        elif team_id:
            queryset = queryset.filter(
                Q(team_id=team_id)
                | Q(season_assignments__team_season__team_id=team_id)
            )

        return queryset.distinct().order_by("last_name", "first_name")


class CoachSeasonAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = CoachSeasonAssignmentSerializer
    lookup_field = "assignment_id"

    def get_queryset(self):
        queryset = CoachSeasonAssignment.objects.select_related(
            "coach",
            "team_season",
            "team_season__team",
            "team_season__season",
        )

        team_id = (
            self.request.query_params.get("team")
            or self.request.query_params.get("team_id")
        )

        season_id = (
            self.request.query_params.get("season")
            or self.request.query_params.get("season_id")
        )

        year = (
            self.request.query_params.get("year")
            or self.request.query_params.get("season_year")
        )

        coach_id = (
            self.request.query_params.get("coach")
            or self.request.query_params.get("coach_id")
        )

        active = self.request.query_params.get("active")

        if team_id:
            queryset = queryset.filter(team_season__team_id=team_id)

        if season_id:
            queryset = queryset.filter(team_season__season_id=season_id)

        if year:
            queryset = queryset.filter(team_season__season__year=year)

        if coach_id:
            queryset = queryset.filter(coach_id=coach_id)

        if active is not None:
            queryset = queryset.filter(is_active=active.lower() == "true")

        return queryset.order_by(
            "team_season__season__year",
            "team_season__team__team_name",
            "role",
            "coach__last_name",
            "coach__first_name",
        )