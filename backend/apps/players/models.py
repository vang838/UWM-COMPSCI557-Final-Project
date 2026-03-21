from django.db import models
from apps.teams.models import Team
from django.core.validators import MinValueValidator

# Create your models here
class Player(models.Model):
    class PositionChoices(models.TextChoices):
        QB = "QB", "Quarterback"
        RB = "RB", "Running Back"
        WR = "WR", "Wide Receiver"
        TE = "TE", "Tight End"
        OL = "OL", "Offensive Lineman"
        DL = "DL", "Defensive Lineman"
        LB = "LB", "Linebacker"
        CB = "CB", "Cornerback"
        S = "S", "Safety"
        K = "K", "Kicker"
        P = "P", "Punter"

    player_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50, db_index=True)
    position = models.CharField(max_length=2,choices=PositionChoices.choices)
    team = models.ForeignKey(Team, on_delete=models.PROTECT, related_name='players')
    date_of_birth = models.DateField(null=True, blank=True)
    height = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True, validators=[MinValueValidator(0.0)])
    weight = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, validators=[MinValueValidator(0.0)])
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"