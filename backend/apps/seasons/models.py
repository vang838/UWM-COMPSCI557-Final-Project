from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

# Create your models here.
class Season(models.Model):
    season_id = models.AutoField(primary_key=True)
    year = models.PositiveIntegerField(unique=True, validators=[MinValueValidator(1920), MaxValueValidator(2030)])

    class Meta:
        ordering = ["-year"]

    def __str__(self):
        return str(self.year)
class TeamSeason(models.Model):
    team_season_id = models.AutoField(primary_key=True)

    team = models.ForeignKey(
        "teams.Team",
        on_delete=models.CASCADE,
        related_name="team_seasons",
    )

    season = models.ForeignKey(
        Season,
        on_delete=models.CASCADE,
        related_name="team_seasons",
    )

    conference = models.CharField(max_length=50)
    division = models.CharField(max_length=50)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["team", "season"],
                name="unique_team_per_season",
            )
        ]
        ordering = ["season__year", "conference", "division", "team__team_name"]

    def __str__(self):
        return f"{self.team} - {self.season.year}"