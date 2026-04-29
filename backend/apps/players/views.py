from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action

from apps.players.models import Player
from apps.stats.models import PlayerSeasonStat
from apps.seasons.models import Season

from .serializers import PlayerDashboardSerializer, PlayerSeasonBreakdownSerializer, PlayerSeasonStatSerializer


class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerDashboardSerializer
    lookup_field = "player_id"

    # custom dashboard endpoint for player stats by season
    @action(detail=True, methods=['get'], url_path='season-stats')
    def season_stats(self, request, player_id=None):
        """
        Get player stats grouped by season
        """
        try:
            player = self.get_object()

            # Get all seasons with stats for this player
            stats = PlayerSeasonStat.objects.filter(
                player=player
            ).select_related('season', 'stat_type').order_by('season__start_year')

            # Group by season
            season_data = {}
            for stat in stats:
                season_key = stat.season.start_year
                if season_key not in season_data:
                    season_data[season_key] = {
                        'season': stat.season.start_year,
                        'total_stats': []
                    }

                season_data[season_key]['total_stats'].append({
                    'stat_type': stat.stat_type.name,
                    'value': stat.value
                })

            return Response({
                'player_id': player.player_id,
                'first_name': player.first_name,
                'last_name': player.last_name,
                'seasons': list(season_data.values())
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    # endpoint for player stats by season
    @action(detail=True, methods=['get'], url_path='stats/season/(?P<season_id>[^/.]+)')
    def player_season_stats(self, request, player_id=None, season_id=None):
        """
        Get specific player's stats for a specific season
        """
        try:
            player = self.get_object()
            season = Season.objects.get(season_id=season_id)

            stats = PlayerSeasonStat.objects.filter(
                player=player,
                season=season
            ).select_related('stat_type')

            stat_data = []
            for stat in stats:
                stat_data.append({
                    'stat_type': stat.stat_type.name,
                    'value': stat.value,
                    'description': stat.stat_type.description
                })

            return Response({
                'player_id': player.player_id,
                'season': season.start_year,
                'stats': stat_data
            })

        except Season.DoesNotExist:
            return Response(
                {'error': 'Season not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )