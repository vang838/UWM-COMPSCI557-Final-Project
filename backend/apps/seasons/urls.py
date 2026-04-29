from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.seasons.views import SeasonViewSet

router = DefaultRouter()
router.register(r"seasons", SeasonViewSet, basename="season")

urlpatterns = [
    path("", include(router.urls)),
]