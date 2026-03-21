from django.contrib import admin
from .models import Season, TeamSeason

# Register your models here.
@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ('season_id', 'year')
    search_fields = ('year',)


@admin.register(TeamSeason)
class TeamSeasonAdmin(admin.ModelAdmin):
    list_display = ('team_season_id', 'team', 'season', 'conference', 'division')
    list_filter = ('conference', 'division', 'season')
    search_fields = ('team__team_name', 'team__city', 'season__year')