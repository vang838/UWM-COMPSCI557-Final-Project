from rest_framework import serializers

from .models import Player
from apps.stats.models import PlayerSeasonStat, PositionStatType


class PlayerSeasonStatSerializer(serializers.ModelSerializer):
    stat_type_id = serializers.IntegerField(source="stat_type.stat_type_id", read_only=True)
    stat_type_key = serializers.CharField(source="stat_type.key", read_only=True)
    stat_type_name = serializers.CharField(source="stat_type.name", read_only=True)
    stat_type_category = serializers.CharField(source="stat_type.category", read_only=True)
    stat_type_unit = serializers.CharField(source="stat_type.unit", read_only=True)

    player_roster_id = serializers.IntegerField(source="player_roster.roster_id", read_only=True)
    player_id = serializers.IntegerField(source="player_roster.player.player_id", read_only=True)
    player_name = serializers.SerializerMethodField()
    player_position = serializers.CharField(source="player_roster.player.position", read_only=True)

    team_id = serializers.IntegerField(source="player_roster.team_season.team.team_id", read_only=True)
    team_name = serializers.SerializerMethodField()
    team_abbreviation = serializers.CharField(
        source="player_roster.team_season.team.abbreviation",
        read_only=True,
    )

    season_id = serializers.IntegerField(source="player_roster.team_season.season.season_id", read_only=True)
    season_year = serializers.IntegerField(source="player_roster.team_season.season.year", read_only=True)

    class Meta:
        model = PlayerSeasonStat
        fields = [
            "player_season_stat_id",
            "player_roster_id",
            "player_id",
            "player_name",
            "player_position",
            "team_id",
            "team_name",
            "team_abbreviation",
            "season_id",
            "season_year",
            "stat_type_id",
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


class PlayerDashboardSerializer(serializers.ModelSerializer):
    team_name = serializers.SerializerMethodField()
    jersey_number = serializers.SerializerMethodField()
    season_stats = serializers.SerializerMethodField()

    class Meta:
        model = Player
        fields = [
            "player_id",
            "first_name",
            "last_name",
            "position",
            "team",
            "team_name",
            "jersey_number",
            "age",
            "height",
            "weight",
            "is_active",
            "season_stats",
        ]

    def get_team_name(self, obj):
        if not obj.team:
            return None

        city = getattr(obj.team, "city", "") or ""
        team_name = getattr(obj.team, "team_name", "") or ""

        return f"{city} {team_name}".strip() or team_name or None

    def get_matching_roster_queryset(self, obj):
        """
        Returns this player's roster rows, optionally filtered by the request's
        selected team and season/year.
        """
        request = self.context.get("request")

        roster_queryset = obj.season_rosters.select_related(
            "team_season",
            "team_season__team",
            "team_season__season",
        )

        if not request:
            return roster_queryset

        team_id = (
            request.query_params.get("team")
            or request.query_params.get("team_id")
        )

        season_year = (
            request.query_params.get("year")
            or request.query_params.get("season_year")
        )

        season_id = (
            request.query_params.get("season")
            or request.query_params.get("season_id")
        )

        if team_id:
            roster_queryset = roster_queryset.filter(
                team_season__team_id=team_id
            )

        if season_year:
            roster_queryset = roster_queryset.filter(
                team_season__season__year=season_year
            )

        if season_id:
            roster_queryset = roster_queryset.filter(
                team_season__season_id=season_id
            )

        return roster_queryset

    def get_jersey_number(self, obj):
        """
        Jersey number is historical roster data, not a direct Player field.
        """
        roster = (
            self.get_matching_roster_queryset(obj)
            .order_by("-team_season__season__year")
            .first()
        )

        if not roster:
            return None

        return roster.jersey_number

    def get_season_stats(self, obj):
        """
        Return flexible StatType + value records.

        This intentionally does not hardcode passing_yards, rushing_yards,
        tackles, interceptions, etc. Any player can have any stat if it exists
        as a PlayerSeasonStat row.
        """
        roster_ids = self.get_matching_roster_queryset(obj).values_list(
            "roster_id",
            flat=True,
        )

        stats = (
            PlayerSeasonStat.objects.filter(player_roster_id__in=roster_ids)
            .select_related(
                "player_roster",
                "player_roster__player",
                "player_roster__team_season",
                "player_roster__team_season__team",
                "player_roster__team_season__season",
                "stat_type",
            )
        )

        position = obj.position

        primary_stat_map = {
            mapping.stat_type_id: {
                "is_primary": mapping.is_primary,
                "display_order": mapping.display_order,
            }
            for mapping in PositionStatType.objects.filter(position=position)
        }

        serialized_stats = []

        for stat in stats:
            display_config = primary_stat_map.get(
                stat.stat_type_id,
                {
                    "is_primary": False,
                    "display_order": 999,
                },
            )

            serialized_stats.append(
                {
                    "player_season_stat_id": stat.id,
                    "roster_id": stat.player_roster_id,
                    "season_year": stat.player_roster.team_season.season.year,
                    "team_id": stat.player_roster.team_season.team.team_id,
                    "team_abbreviation": stat.player_roster.team_season.team.abbreviation,
                    "stat_type_id": stat.stat_type.stat_type_id,
                    "stat_type_key": stat.stat_type.key,
                    "stat_type_name": stat.stat_type.name,
                    "stat_type_category": stat.stat_type.category,
                    "stat_type_unit": stat.stat_type.unit,
                    "value": stat.value,
                    "is_primary": display_config["is_primary"],
                    "display_order": display_config["display_order"],
                }
            )

        return sorted(
            serialized_stats,
            key=lambda item: (
                item["season_year"],
                not item["is_primary"],
                item["display_order"],
                item["stat_type_name"],
            ),
        )


class PlayerSeasonBreakdownSerializer(serializers.ModelSerializer):
    stat_type_key = serializers.CharField(source="stat_type.key", read_only=True)
    stat_type_name = serializers.CharField(source="stat_type.name", read_only=True)
    stat_type_category = serializers.CharField(source="stat_type.category", read_only=True)
    stat_type_unit = serializers.CharField(source="stat_type.unit", read_only=True)

    player_roster_id = serializers.IntegerField(source="player_roster.roster_id", read_only=True)
    player_id = serializers.IntegerField(source="player_roster.player.player_id", read_only=True)
    player_name = serializers.SerializerMethodField()
    position = serializers.CharField(source="player_roster.player.position", read_only=True)

    team_id = serializers.IntegerField(source="player_roster.team_season.team.team_id", read_only=True)
    team_abbreviation = serializers.CharField(
        source="player_roster.team_season.team.abbreviation",
        read_only=True,
    )

    season_id = serializers.IntegerField(source="player_roster.team_season.season.season_id", read_only=True)
    season_year = serializers.IntegerField(source="player_roster.team_season.season.year", read_only=True)

    class Meta:
        model = PlayerSeasonStat
        fields = [
            "player_season_stat_id",
            "player_roster_id",
            "player_id",
            "player_name",
            "position",
            "team_id",
            "team_abbreviation",
            "season_id",
            "season_year",
            "stat_type_id",
            "stat_type_key",
            "stat_type_name",
            "stat_type_category",
            "stat_type_unit",
            "value",
        ]

    def get_player_name(self, obj):
        player = obj.player_roster.player
        return f"{player.first_name} {player.last_name}".strip()