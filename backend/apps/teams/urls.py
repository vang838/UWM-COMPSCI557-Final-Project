# backend/apps/teams/urls.py
from rest_framework.routers import DefaultRouter
from .views import TeamViewSet, CoachViewSet

router = DefaultRouter()
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'coaches', TeamViewSet, basename='coach')

urlpatterns = router.urls