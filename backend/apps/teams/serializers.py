from rest_framework import serializers
from apps.teams.models import Team, Coach


class TeamSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = (
            "team_id",
            "city",
            "state",
            "team_name",
            "display_name",
            "conference",
            "division",
            "abbreviation",
            "primary_color",
            "secondary_color",
            "text_color",
        )

    def get_display_name(self, obj):
        return f"{obj.city} {obj.team_name}".strip() or obj.team_name

class CoachSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coach
        fields = [
            "coach_id",
            "first_name",
            "last_name",
            "role",
            "team",
        ]