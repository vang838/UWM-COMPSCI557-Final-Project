from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.seasons.views import SeasonViewSet, TeamSeasonViewSet, PlayerSeasonRosterViewSet

router = DefaultRouter()
router.register(r"seasons", SeasonViewSet, basename="season")
router.register(r"team-seasons", TeamSeasonViewSet, basename="team-season")
router.register(r"player-season-rosters", PlayerSeasonRosterViewSet, basename="player-season-roster",)
urlpatterns = [
    path("", include(router.urls)),
]