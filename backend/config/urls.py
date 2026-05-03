from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/", include("apps.players.urls")),
    path("api/", include("apps.seasons.urls")),
    path("api/", include("apps.teams.urls")),
    path("api/", include("apps.stats.urls")),
    path("api/", include("apps.users.urls")),

    path("api/reports/", include("apps.reports.urls")),
]