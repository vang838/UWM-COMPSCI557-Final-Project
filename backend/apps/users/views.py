from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.utils import json
from rest_framework.permissions import IsAuthenticated
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from django.contrib.auth import authenticate, login, get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from apps.users.models import UserPreference
from apps.users.serializers import (
    CurrentUserSerializer,
    RegisterSerializer,
    UserAdminSerializer,
    UserPreferenceSerializer,
)


# Create your views here.
#login stuff
@csrf_exempt
def login_view(request):
    if request.method == "POST":    # Authenticate user via username/password, returns token + user role
        try:
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")

            if not username or not password:
                return JsonResponse({"success": False, "error": "username and password required"}, status=400)

            user = authenticate(request, username=username, password=password)

            if user is not None:
                token, created = Token.objects.get_or_create(user=user)
                return JsonResponse({
                    "success": True,
                    "token": token.key,
                    "user_id": user.id,
                    "username": user.username,
                    "role": user.role})
            else:
                return JsonResponse({"success": False, "error": "Invalid credentials"},status=401)
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "error": "Invalid JSON"},status=400)
    else:
        return JsonResponse({"success": False, "error": "Method not allowed"}, status=405)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):   # Invalidate user token which should invalidate all future requests when user logs out
    try:
        request.user.auth_token.delete()
        return JsonResponse({"success": True, "message": "Successfully logged out"})
    except Exception as e:
        return JsonResponse({"success": False, "error": "Logout failed"}, status=500)

User = get_user_model()


class IsGridTrackerAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and (getattr(user, "role", None) == "admin" or user.is_staff)
        )


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {
                "token": token.key,
                "user_id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "role": user.role,
            },
            status=status.HTTP_201_CREATED,
        )


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = CurrentUserSerializer(
            request.user,
            data=request.data,
            partial=True,
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data)


class UserPreferenceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, request):
        preferences, _ = UserPreference.objects.get_or_create(user=request.user)
        return preferences

    def get(self, request):
        serializer = UserPreferenceSerializer(self.get_object(request))
        return Response(serializer.data)

    def patch(self, request):
        preferences = self.get_object(request)

        serializer = UserPreferenceSerializer(
            preferences,
            data=request.data,
            partial=True,
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data)


class UserAdminViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("username")
    serializer_class = UserAdminSerializer
    permission_classes = [IsGridTrackerAdmin]

    def perform_update(self, serializer):
        target_user = self.get_object()
        request_user = self.request.user

        next_role = serializer.validated_data.get("role", target_user.role)
        next_is_active = serializer.validated_data.get(
            "is_active",
            target_user.is_active,
        )

        if target_user.id == request_user.id:
            if next_role != "admin":
                raise ValidationError(
                    "You cannot remove your own admin role."
                )

            if next_is_active is False:
                raise ValidationError(
                    "You cannot deactivate your own account."
                )

        serializer.save()

    def perform_destroy(self, instance):
        if instance.id == self.request.user.id:
            raise ValidationError("You cannot delete your own account.")

        instance.delete()