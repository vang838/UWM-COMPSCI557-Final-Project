from django.db import models


class StatType(models.Model):
    stat_type_id = models.AutoField(primary_key=True)
    key = models.CharField(max_length=64, unique=True,)
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    unit = models.CharField(max_length=30, blank=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class PositionStatType(models.Model):
    position = models.CharField(max_length=10)
    stat_type = models.ForeignKey(
        StatType,
        on_delete=models.CASCADE,
        related_name="position_mappings",
    )
    display_order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["position", "stat_type"],
                name="unique_position_stat_type",
            )
        ]
        ordering = ["position", "display_order", "stat_type__name"]

    def __str__(self):
        return f"{self.position} - {self.stat_type.name}"


class PlayerSeasonStat(models.Model):
    player_roster = models.ForeignKey(
        "seasons.PlayerSeasonRoster",
        on_delete=models.PROTECT,
        related_name="stats",
        null=True,
        blank=True,
    )

    stat_type = models.ForeignKey(
        StatType,
        on_delete=models.PROTECT,
        related_name="player_stats",
    )

    value = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["player_roster", "stat_type"],
                name="unique_stat_per_roster_stat_type",
            )
        ]
        ordering = [
            "player_roster__team_season__season__year",
            "player_roster__player__last_name",
            "stat_type__category",
            "stat_type__name",
        ]

    def __str__(self):
        return f"{self.player_roster} - {self.stat_type.name}: {self.value}"