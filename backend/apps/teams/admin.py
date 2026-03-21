from django.contrib import admin
from .models import Team, Coach

# Register your models here.
@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('team_id', 'team_name', 'city', 'state')
    list_filter = ('team_name', 'city', 'state')
    search_fields = ('city', 'state')

@admin.register(Coach)
class CoachAdmin(admin.ModelAdmin):
    list_display = ('coach_id', 'first_name', 'last_name', 'role', 'team')
    list_filter = ('role', 'team')
    search_fields = ('first_name', 'last_name')