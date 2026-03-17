from django.db import models
from apps.players.models import Player
from apps.seasons.models import Season

# Create your models here.
class StatType(models.Model):
    stat_type_id = models.AutoField(primary_key=True)
    stat_name = models.CharField(max_length=50)
    category = models.CharField(max_length=50)  # e.g., 'Passing', 'Rushing', 'Receiving'

    def __str__(self):
        return self.stat_name

class PlayerSeasonStat(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    season = models.ForeignKey(Season, on_delete=models.CASCADE)
    stat_type = models.ForeignKey(StatType, on_delete=models.CASCADE)
    value = models.FloatField()

    class Meta:
        unique_together = ('player', 'season', 'stat_type')  # composite PK equivalent

    def __str__(self):
        return f"{self.player} | {self.season} | {self.stat_type}: {self.value}"