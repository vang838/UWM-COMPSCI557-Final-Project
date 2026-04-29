from rest_framework import serializers
from apps.seasons.models import Season, TeamSeason, PlayerSeasonRoster

class SeasonSerializer(serializers.ModelSerializer):
    team_count = serializers.SerializerMethodField()

    class Meta:
        model = Season
        fields = ["season_id", "year", "team_count"]

    def get_team_count(self, obj):
        return obj.team_seasons.count()

class TeamSeasonSerializer(serializers.ModelSerializer):
    season_year = serializers.IntegerField(source="season.year", read_only=True)
    team_name = serializers.CharField(source="team.team_name", read_only=True)
    team_city = serializers.CharField(source="team.city", read_only=True)
    team_display_name = serializers.SerializerMethodField()
    team_abbreviation = serializers.CharField(source="team.abbreviation", read_only=True)
    primary_color = serializers.CharField(source="team.primary_color", read_only=True)
    secondary_color = serializers.CharField(source="team.secondary_color", read_only=True)
    text_color = serializers.CharField(source="team.text_color", read_only=True)

    class Meta:
        model = TeamSeason
        fields = [
            "team_season_id",
            "team",
            "season",
            "season_year",
            "team_name",
            "team_city",
            "team_display_name",
            "team_abbreviation",
            "conference",
            "division",
            "primary_color",
            "secondary_color",
            "text_color",
        ]

    def get_team_display_name(self, obj):
        return f"{obj.team.city} {obj.team.team_name}".strip() or obj.team.team_name

class PlayerSeasonRosterSerializer(serializers.ModelSerializer):
    player_name = serializers.SerializerMethodField()
    player_position = serializers.CharField(source="player.position", read_only=True)

    team_season_id = serializers.IntegerField(source="team_season.team_season_id", read_only=True)
    team_id = serializers.IntegerField(source="team_season.team.team_id", read_only=True)
    team_display_name = serializers.SerializerMethodField()
    team_abbreviation = serializers.CharField(source="team_season.team.abbreviation", read_only=True)

    season_id = serializers.IntegerField(source="team_season.season.season_id", read_only=True)
    season_year = serializers.IntegerField(source="team_season.season.year", read_only=True)

    conference = serializers.CharField(source="team_season.conference", read_only=True)
    division = serializers.CharField(source="team_season.division", read_only=True)

    class Meta:
        model = PlayerSeasonRoster
        fields = [
            "roster_id",
            "player",
            "player_name",
            "player_position",
            "team_season",
            "team_season_id",
            "team_id",
            "team_display_name",
            "team_abbreviation",
            "season_id",
            "season_year",
            "conference",
            "division",
            "jersey_number",
            "roster_status",
            "is_active",
        ]

    def get_player_name(self, obj):
        return f"{obj.player.first_name} {obj.player.last_name}".strip()

    def get_team_display_name(self, obj):
        team = obj.team_season.team
        return f"{team.city} {team.team_name}".strip() or team.team_name