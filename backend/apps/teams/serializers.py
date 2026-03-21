from rest_framework import serializers
from .models import Team, Coach

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = [
            'team_id',
            'team_name',
            'conference',
            'division'
        ]

class CoachSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coach
        fields = {
            'coach_id',
            'first_name',
            'last_name',
            'role',
            'team'
        }