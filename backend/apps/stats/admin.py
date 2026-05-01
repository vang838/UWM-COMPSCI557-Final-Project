from django.contrib import admin

from apps.stats.models import StatType, PositionStatType, PlayerSeasonStat


@admin.register(StatType)
class StatTypeAdmin(admin.ModelAdmin):
    list_display = ("stat_type_id", "key", "name", "category", "unit")
    search_fields = ("key", "name", "category")
    list_filter = ("category",)


@admin.register(PositionStatType)
class PositionStatTypeAdmin(admin.ModelAdmin):
    list_display = ("position", "stat_type", "display_order", "is_primary")
    search_fields = ("position", "stat_type__key", "stat_type__name")
    list_filter = ("position", "is_primary")
    ordering = ("position", "display_order")


@admin.register(PlayerSeasonStat)
class PlayerSeasonStatAdmin(admin.ModelAdmin):
    list_display = (
        "player_roster",
        "stat_type",
        "value",
    )
    search_fields = (
        "player_roster__player__first_name",
        "player_roster__player__last_name",
        "stat_type__key",
        "stat_type__name",
    )
    list_filter = (
        "player_roster__team_season__season",
        "player_roster__team_season__team",
        "stat_type__category",
    )