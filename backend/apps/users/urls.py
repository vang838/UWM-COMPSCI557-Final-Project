from django.urls import path, include
from .views import login_view, logout_view
from rest_framework.routers import DefaultRouter

from apps.users.views import (
    CurrentUserView,
    RegisterView,
    UserAdminViewSet,
    UserPreferenceView,
)


router = DefaultRouter()
router.register(r"users", UserAdminViewSet, basename="admin-user")

urlpatterns = [
    path("", include(router.urls)),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/me/", CurrentUserView.as_view(), name="current-user"),
    path("user-preferences/", UserPreferenceView.as_view(), name="user-preferences"),
]