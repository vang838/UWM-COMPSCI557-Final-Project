from django.contrib import admin
from .models import Player

# Register your models here.
@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ('player_id', 'first_name', 'last_name', 'position', 'team', 'is_active')
    list_filter = ('position', 'is_active', 'team')
    search_fields = ('first_name', 'last_name')