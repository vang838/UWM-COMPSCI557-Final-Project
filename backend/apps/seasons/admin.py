from django.contrib import admin
from .models import Season, TeamSeason, PlayerSeasonRoster

# Register your models here.
@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ("season_id", "year",)
    list_filter = ("year",)
    search_fields = ("year",)
    ordering = ("-year",)

@admin.register(TeamSeason)
class TeamSeasonAdmin(admin.ModelAdmin):
    list_display = (
        "team_season_id",
        "team",
        "season",
        "conference",
        "division",
    )
    list_filter = ("season", "conference", "division")
    search_fields = (
        "team__team_name",
        "team__city",
        "team__abbreviation",
        "season__year",
    )
    ordering = ("-season__year", "conference", "division", "team__team_name")

@admin.register(PlayerSeasonRoster)
class PlayerSeasonRosterAdmin(admin.ModelAdmin):
    list_display = (
        "roster_id",
        "player",
        "team_season",
        "jersey_number",
        "roster_status",
        "is_active",
    )
    list_filter = (
        "team_season__season",
        "team_season__team",
        "roster_status",
        "is_active",
    )
    search_fields = (
        "player__first_name",
        "player__last_name",
        "team_season__team__team_name",
        "team_season__team__city",
        "team_season__season__year",
    )
    ordering = (
        "-team_season__season__year",
        "team_season__team__team_name",
        "player__last_name",
    )