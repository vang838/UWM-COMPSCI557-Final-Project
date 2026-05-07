from django.contrib import admin

from .models import Player


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = (
        "player_id",
        "first_name",
        "last_name",
        "position",
        "team",
        "date_of_birth",
        "age_display",
        "college",
        "height",
        "weight",
        "is_active",
    )

    list_filter = (
        "position",
        "team",
        "is_active",
        "college",
    )

    search_fields = (
        "first_name",
        "last_name",
        "position",
        "college",
        "team__team_name",
        "team__city",
        "team__abbreviation",
    )

    readonly_fields = (
        "age_display",
    )

    fieldsets = (
        (
            "Basic Info",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "position",
                    "team",
                    "is_active",
                )
            },
        ),
        (
            "Player Bio",
            {
                "fields": (
                    "date_of_birth",
                    "age_display",
                    "college",
                    "height",
                    "weight",
                    "headshot_url",
                )
            },
        ),
    )

    ordering = (
        "last_name",
        "first_name",
    )

    @admin.display(description="Age")
    def age_display(self, obj):
        return obj.age