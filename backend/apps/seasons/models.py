from django.db import models
from apps.teams.models import Team

# Create your models here.
class Season(models.Model):
    season_id = models.AutoField(primary_key=True)
    year = models.IntegerField(unique=True)

    def __str__(self):
        return str(self.year)

class TeamSeason(models.Model):
    class ConferenceChoices(models.TextChoices):
        AFC = "AFC", "AFC"
        NFC = "NFC", "NFC"

    class DivisionChoices(models.TextChoices):
        NORTH = "North", "North"
        SOUTH = "South", "South"
        EAST = "East", "East"
        WEST = "West", "West"

    team_season_id = models.AutoField(primary_key=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='team_seasons')
    season = models.ForeignKey(Season, on_delete=models.CASCADE, related_name='team_seasons')
    conference = models.CharField(max_length=3, choices=ConferenceChoices.choices)
    division = models.CharField(max_length=5, choices=DivisionChoices.choices)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields = ['team', 'season'],
                name = 'unique_team_season',
            )
        ]

    def __str__(self):
        return f"{self.team} - {self.season}"