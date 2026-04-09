from django.contrib import admin
from .models import Season

# Register your models here.
@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ("season_id", "year",)
    list_filter = ("year",)
    search_fields = ("year",)
    ordering = ("-year",)