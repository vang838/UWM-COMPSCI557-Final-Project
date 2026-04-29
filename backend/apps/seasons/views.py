from rest_framework import viewsets
from apps.seasons.models import Season
from apps.seasons.serializers import SeasonSerializer

# Create your views here.
class SeasonViewSet(viewsets.ModelViewSet):
    queryset = Season.objects.all().order_by("year")
    serializer_class = SeasonSerializer
    lookup_field = "season_id"