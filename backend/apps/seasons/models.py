from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Season(models.Model):
    season_id = models.AutoField(primary_key=True)
    year = models.PositiveIntegerField(
        unique=True,
        validators=[MinValueValidator(1920), MaxValueValidator(2030)],
    )

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
        indexes = [
            models.Index(
                fields=["season", "team"],
                name="idx_teamseason_season_team",
            ),
            models.Index(
                fields=["conference", "division"],
                name="idx_teamseason_conf_div",
            ),
        ]
        ordering = [
            "season__year",
            "conference",
            "division",
            "team__team_name",
        ]

    def __str__(self):
        return f"{self.team} - {self.season.year}"


class PlayerSeasonRoster(models.Model):
    roster_id = models.AutoField(primary_key=True)

    player = models.ForeignKey(
        "players.Player",
        on_delete=models.PROTECT,
        related_name="season_rosters",
    )

    team_season = models.ForeignKey(
        "seasons.TeamSeason",
        on_delete=models.PROTECT,
        related_name="player_rosters",
    )

    jersey_number = models.PositiveIntegerField(null=True, blank=True)
    roster_status = models.CharField(max_length=30, default="Active")
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["player", "team_season"],
                name="unique_player_per_team_season",
            )
        ]
        indexes = [
            models.Index(
                fields=["team_season", "is_active"],
                name="idx_roster_teamseason_active",
            ),
            models.Index(
                fields=["player", "is_active"],
                name="idx_roster_player_active",
            ),
            models.Index(
                fields=["roster_status"],
                name="idx_roster_status",
            ),
        ]
        ordering = [
            "team_season__season__year",
            "team_season__team__team_name",
            "player__last_name",
            "player__first_name",
        ]

    def __str__(self):
        return (
            f"{self.player} - "
            f"{self.team_season.team} "
            f"({self.team_season.season.year})"
        )