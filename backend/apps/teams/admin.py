from django.contrib import admin

from apps.teams.models import Team, Coach, CoachSeasonAssignment


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = (
        "team_id",
        "city",
        "team_name",
        "abbreviation",
        "conference",
        "division",
    )
    search_fields = ("city", "team_name", "abbreviation")
    list_filter = ("conference", "division")
    ordering = ("team_name",)


@admin.register(Coach)
class CoachAdmin(admin.ModelAdmin):
    list_display = (
        "coach_id",
        "first_name",
        "last_name",
        "role",
        "team",
    )
    search_fields = ("first_name", "last_name", "role", "team__team_name")
    list_filter = ("team", "role")
    ordering = ("last_name", "first_name")


@admin.register(CoachSeasonAssignment)
class CoachSeasonAssignmentAdmin(admin.ModelAdmin):
    list_display = (
        "assignment_id",
        "coach",
        "role",
        "team_season",
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
        "team_season__season__year",
    )
    list_filter = (
        "is_active",
        "role",
        "team_season__season",
        "team_season__team",
    )
    ordering = (
        "team_season__season__year",
        "team_season__team__team_name",
        "role",
        "coach__last_name",
    )