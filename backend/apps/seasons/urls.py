from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.seasons.views import SeasonViewSet, TeamSeasonViewSet

router = DefaultRouter()
router.register(r"seasons", SeasonViewSet, basename="season")
router.register(r"team-seasons", TeamSeasonViewSet, basename="team-season")

urlpatterns = [
    path("", include(router.urls)),
]