# backend/apps/stats/serializers.py

from rest_framework import serializers

from apps.stats.models import StatType, PositionStatType, PlayerSeasonStat


class StatTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatType
        fields = [
            "stat_type_id",
            "key",
            "name",
            "category",
            "unit",
            "description",
        ]


class PositionStatTypeSerializer(serializers.ModelSerializer):
    stat_type_key = serializers.CharField(source="stat_type.key", read_only=True)
    stat_type_name = serializers.CharField(source="stat_type.name", read_only=True)
    stat_type_category = serializers.CharField(source="stat_type.category", read_only=True)

    class Meta:
        model = PositionStatType
        fields = [
            "id",
            "position",
            "stat_type",
            "stat_type_key",
            "stat_type_name",
            "stat_type_category",
            "display_order",
            "is_primary",
        ]


class PlayerSeasonStatSerializer(serializers.ModelSerializer):
    player_season_stat_id = serializers.IntegerField(source="id", read_only=True)

    stat_type_key = serializers.CharField(source="stat_type.key", read_only=True)
    stat_type_name = serializers.CharField(source="stat_type.name", read_only=True)
    stat_type_category = serializers.CharField(source="stat_type.category", read_only=True)
    stat_type_unit = serializers.CharField(source="stat_type.unit", read_only=True)

    player_id = serializers.IntegerField(source="player_roster.player.player_id", read_only=True)
    player_name = serializers.SerializerMethodField()
    position = serializers.CharField(source="player_roster.player.position", read_only=True)

    team_id = serializers.IntegerField(source="player_roster.team_season.team.team_id", read_only=True)
    team_name = serializers.SerializerMethodField()
    team_abbreviation = serializers.CharField(
        source="player_roster.team_season.team.abbreviation",
        read_only=True,
    )

    season_id = serializers.IntegerField(
        source="player_roster.team_season.season.season_id",
        read_only=True,
    )
    season_year = serializers.IntegerField(
        source="player_roster.team_season.season.year",
        read_only=True,
    )

    class Meta:
        model = PlayerSeasonStat
        fields = [
            "player_season_stat_id",
            "player_roster",
            "player_id",
            "player_name",
            "position",
            "team_id",
            "team_name",
            "team_abbreviation",
            "season_id",
            "season_year",
            "stat_type",
            "stat_type_key",
            "stat_type_name",
            "stat_type_category",
            "stat_type_unit",
            "value",
        ]

    def get_player_name(self, obj):
        player = obj.player_roster.player
        return f"{player.first_name} {player.last_name}".strip()

    def get_team_name(self, obj):
        team = obj.player_roster.team_season.team
        return f"{team.city} {team.team_name}".strip() or team.team_name