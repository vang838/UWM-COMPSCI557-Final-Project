from rest_framework.routers import DefaultRouter
from django.urls import include, path
from .views import PlayerViewSet

router = DefaultRouter()
router.register(r'players', PlayerViewSet, basename='player')
urlpatterns = router.urls