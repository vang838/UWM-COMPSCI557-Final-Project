from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.stats.views import (
    StatTypeViewSet,
    PositionStatTypeViewSet,
    PlayerSeasonStatViewSet,
)

router = DefaultRouter()
router.register(r"stat-types", StatTypeViewSet, basename="stat-type")
router.register(r"position-stat-types", PositionStatTypeViewSet, basename="position-stat-type")
router.register(r"player-season-stats", PlayerSeasonStatViewSet, basename="player-season-stat")

urlpatterns = [
    path("", include(router.urls)),
]