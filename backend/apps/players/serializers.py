# serializers.py
from rest_framework import serializers
from .models import Player, Team
from apps.stats.models import PlayerSeasonStat

class PlayerDashboardSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)
    season_stats = serializers.SerializerMethodField()

    class Meta:
        model = Player
        fields = [
            'player_id', 'first_name', 'last_name', 'position',
            'team_name', 'jersey_number', 'height', 'weight',
            'birth_date', 'college', 'draft_year', 'season_stats'
        ]

    def get_season_stats(self, obj):
        # Get all season stats for this player
        player_stats = PlayerSeasonStat.objects.filter(player=obj).select_related('season')
        return PlayerSeasonStatSerializer(player_stats, many=True).data


class PlayerSeasonBreakdownSerializer(serializers.ModelSerializer):
    season_name = serializers.CharField(source='season.name', read_only=True)
    total_points = serializers.SerializerMethodField()

    class Meta:
        model = PlayerSeasonStat
        fields = [
            'season_name', 'games_played', 'total_points',
            'passing_yards', 'rushing_yards', 'receiving_yards',
            'touchdowns', 'interceptions', 'fumbles'
        ]

    def get_total_points(self, obj):
        # Calculate total points based on your scoring system
        return (obj.passing_yards // 25) + (obj.rushing_yards // 10) + (obj.receiving_yards // 10) + obj.touchdowns * 6


class PlayerSeasonStatSerializer(serializers.ModelSerializer):
    season_name = serializers.CharField(source='season.name', read_only=True)

    class Meta:
        model = PlayerSeasonStat
        fields = [
            'season_name', 'games_played', 'passing_yards',
            'rushing_yards', 'receiving_yards', 'touchdowns',
            'interceptions', 'fumbles'
        ]