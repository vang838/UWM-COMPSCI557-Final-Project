from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.teams.views import (
    TeamViewSet,
    CoachViewSet,
    CoachSeasonAssignmentViewSet,
)

router = DefaultRouter()
router.register(r"teams", TeamViewSet, basename="team")
router.register(r"coaches", CoachViewSet, basename="coach")
router.register(
    r"coach-season-assignments",
    CoachSeasonAssignmentViewSet,
    basename="coach-season-assignment",
)

urlpatterns = [
    path("", include(router.urls)),
]