from django.contrib import admin

from apps.teams.models import Team, Coach, CoachSeasonAssignment


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = (
        "team_id",
        "city",
        "team_name",
        "abbreviation",
    )
    search_fields = ("city", "team_name", "abbreviation")
    ordering = ("team_name",)


@admin.register(Coach)
class CoachAdmin(admin.ModelAdmin):
    list_select_related = ("team",)

    list_display = (
        "coach_id",
        "first_name",
        "last_name",
        "role",
        "team",
    )

    search_fields = (
        "first_name",
        "last_name",
        "role",
        "team__team_name",
        "team__city",
        "team__abbreviation",
    )

    list_filter = (
        "team",
        "role",
    )

    ordering = (
        "last_name",
        "first_name",
    )


@admin.register(CoachSeasonAssignment)
class CoachSeasonAssignmentAdmin(admin.ModelAdmin):
    list_select_related = (
        "coach",
        "team_season",
        "team_season__team",
        "team_season__season",
    )

    list_display = (
        "assignment_id",
        "coach",
        "role",
        "team_name",
        "season_year",
        "conference",
        "division",
        "is_active",
        "start_date",
        "end_date",
    )

    search_fields = (
        "coach__first_name",
        "coach__last_name",
        "role",
        "team_season__team__team_name",
        "team_season__team__city",
        "team_season__team__abbreviation",
        "team_season__season__year",
    )

    list_filter = (
        "is_active",
        "role",
        "team_season__season",
        "team_season__team",
        "team_season__conference",
        "team_season__division",
    )

    ordering = (
        "-team_season__season__year",
        "team_season__team__team_name",
        "role",
        "coach__last_name",
    )

    @admin.display(description="Team")
    def team_name(self, obj):
        team = obj.team_season.team
        return f"{team.city} {team.team_name}".strip() or team.team_name

    @admin.display(description="Season")
    def season_year(self, obj):
        return obj.team_season.season.year

    @admin.display(description="Conference")
    def conference(self, obj):
        return obj.team_season.conference

    @admin.display(description="Division")
    def division(self, obj):
        return obj.team_season.division