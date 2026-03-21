from django.contrib import admin
from .models import Team, Coach

# Register your models here.
@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('team_id', 'team_name', 'conference', 'division')
    list_filter = ('team_name',)
    search_fields = ('conference', 'division')

@admin.register(Coach)
class CoachAdmin(admin.ModelAdmin):
    list_display = ('coach_id', 'first_name', 'last_name', 'role', 'team')
    list_filter = ('role', 'team')
    search_fields = ('first_name', 'last_name')