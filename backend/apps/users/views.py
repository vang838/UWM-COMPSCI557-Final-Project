from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.utils import json
from rest_framework.permissions import IsAuthenticated

from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


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