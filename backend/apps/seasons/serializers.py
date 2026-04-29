from rest_framework import serializers
from apps.seasons.models import Season

class SeasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Season
        fields = ["season_id", "year"]