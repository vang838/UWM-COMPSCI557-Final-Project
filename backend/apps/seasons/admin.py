from django.contrib import admin
from .models import Season, TeamSeason

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