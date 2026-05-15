from django.db import models


class StatType(models.Model):
    stat_type_id = models.AutoField(primary_key=True)
    key = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50, db_index=True)
    unit = models.CharField(max_length=30, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["category", "name"], name="idx_stattype_category_name"),
        ]
        ordering = ["category", "name"]

    def __str__(self):
        return self.name


class PositionStatType(models.Model):
    position = models.CharField(max_length=10, db_index=True)
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
        indexes = [
            models.Index(
                fields=["position", "is_primary"],
                name="idx_posstat_pos_primary",
            ),
            models.Index(
                fields=["position", "display_order"],
                name="idx_posstat_pos_order",
            ),
        ]
        ordering = ["position", "display_order", "stat_type__name"]

    def __str__(self):
        return f"{self.position} - {self.stat_type.name}"


class PlayerSeasonStat(models.Model):
    player_roster = models.ForeignKey(
        "seasons.PlayerSeasonRoster",
        on_delete=models.PROTECT,
        related_name="stats",
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
        indexes = [
            models.Index(
                fields=["stat_type", "value"],
                name="idx_playerstat_type_value",
            ),
            models.Index(
                fields=["player_roster", "value"],
                name="idx_playerstat_roster_value",
            ),
        ]
        ordering = [
            "player_roster__team_season__season__year",
            "player_roster__player__last_name",
            "stat_type__category",
            "stat_type__name",
        ]

    def __str__(self):
        return f"{self.player_roster} - {self.stat_type.name}: {self.value}"