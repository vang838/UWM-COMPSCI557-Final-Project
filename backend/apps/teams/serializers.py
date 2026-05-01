from rest_framework import serializers

from apps.teams.models import Team, Coach, CoachSeasonAssignment


class TeamSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = (
            "team_id",
            "city",
            "state",
            "team_name",
            "display_name",
            "conference",
            "division",
            "abbreviation",
            "primary_color",
            "secondary_color",
            "text_color",
        )

    def get_display_name(self, obj):
        return f"{obj.city} {obj.team_name}".strip() or obj.team_name


class CoachSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    default_team_name = serializers.SerializerMethodField()
    default_team_abbreviation = serializers.CharField(
        source="team.abbreviation",
        read_only=True,
        allow_null=True,
    )

    assignment_id = serializers.SerializerMethodField()
    assignment_role = serializers.SerializerMethodField()
    assignment_team_id = serializers.SerializerMethodField()
    assignment_team_name = serializers.SerializerMethodField()
    assignment_team_abbreviation = serializers.SerializerMethodField()
    assignment_season_id = serializers.SerializerMethodField()
    assignment_season_year = serializers.SerializerMethodField()

    class Meta:
        model = Coach
        fields = [
            "coach_id",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "team",
            "default_team_name",
            "default_team_abbreviation",
            "assignment_id",
            "assignment_role",
            "assignment_team_id",
            "assignment_team_name",
            "assignment_team_abbreviation",
            "assignment_season_id",
            "assignment_season_year",
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_default_team_name(self, obj):
        if not obj.team:
            return None

        return f"{obj.team.city} {obj.team.team_name}".strip() or obj.team.team_name

    def get_matching_assignment(self, obj):
        request = self.context.get("request")

        queryset = obj.season_assignments.select_related(
            "team_season",
            "team_season__team",
            "team_season__season",
        )

        if not request:
            return queryset.order_by("-team_season__season__year").first()

        team_id = (
            request.query_params.get("team")
            or request.query_params.get("team_id")
        )

        season_id = (
            request.query_params.get("season")
            or request.query_params.get("season_id")
        )

        year = (
            request.query_params.get("year")
            or request.query_params.get("season_year")
        )

        if team_id:
            queryset = queryset.filter(team_season__team_id=team_id)

        if season_id:
            queryset = queryset.filter(team_season__season_id=season_id)

        if year:
            queryset = queryset.filter(team_season__season__year=year)

        return queryset.order_by("-team_season__season__year", "role").first()

    def get_assignment_id(self, obj):
        assignment = self.get_matching_assignment(obj)
        return assignment.assignment_id if assignment else None

    def get_assignment_role(self, obj):
        assignment = self.get_matching_assignment(obj)
        return assignment.role if assignment else None

    def get_assignment_team_id(self, obj):
        assignment = self.get_matching_assignment(obj)
        return assignment.team_season.team.team_id if assignment else None

    def get_assignment_team_name(self, obj):
        assignment = self.get_matching_assignment(obj)

        if not assignment:
            return None

        team = assignment.team_season.team
        return f"{team.city} {team.team_name}".strip() or team.team_name

    def get_assignment_team_abbreviation(self, obj):
        assignment = self.get_matching_assignment(obj)
        return assignment.team_season.team.abbreviation if assignment else None

    def get_assignment_season_id(self, obj):
        assignment = self.get_matching_assignment(obj)
        return assignment.team_season.season.season_id if assignment else None

    def get_assignment_season_year(self, obj):
        assignment = self.get_matching_assignment(obj)
        return assignment.team_season.season.year if assignment else None


class CoachSeasonAssignmentSerializer(serializers.ModelSerializer):
    coach_full_name = serializers.SerializerMethodField()
    coach_first_name = serializers.CharField(source="coach.first_name", read_only=True)
    coach_last_name = serializers.CharField(source="coach.last_name", read_only=True)

    team_id = serializers.IntegerField(
        source="team_season.team.team_id",
        read_only=True,
    )
    team_name = serializers.SerializerMethodField()
    team_abbreviation = serializers.CharField(
        source="team_season.team.abbreviation",
        read_only=True,
    )

    season_id = serializers.IntegerField(
        source="team_season.season.season_id",
        read_only=True,
    )
    season_year = serializers.IntegerField(
        source="team_season.season.year",
        read_only=True,
    )

    conference = serializers.CharField(
        source="team_season.conference",
        read_only=True,
    )
    division = serializers.CharField(
        source="team_season.division",
        read_only=True,
    )

    class Meta:
        model = CoachSeasonAssignment
        fields = [
            "assignment_id",
            "coach",
            "coach_first_name",
            "coach_last_name",
            "coach_full_name",
            "team_season",
            "team_id",
            "team_name",
            "team_abbreviation",
            "season_id",
            "season_year",
            "conference",
            "division",
            "role",
            "is_active",
            "start_date",
            "end_date",
        ]

    def get_coach_full_name(self, obj):
        return f"{obj.coach.first_name} {obj.coach.last_name}".strip()

    def get_team_name(self, obj):
        team = obj.team_season.team
        return f"{team.city} {team.team_name}".strip() or team.team_name