from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Team
from ..stats.models import PlayerSeasonStat, TeamSeasonStat

# Create your views here.
