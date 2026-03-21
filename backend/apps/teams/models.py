from django.db import models

# Create your models here.
class Team(models.Model):
    team_id = models.AutoField(primary_key=True)
    team_name = models.CharField(max_length=100)
    city = models.CharField(max_length=50)
    state = models.CharField(max_length=2)

    class ConferenceChoices(models.TextChoices):
        AFC = "AFC", "AFC"
        NFC = "NFC", "NFC"

    class DivisionChoices(models.TextChoices):
        NORTH = "North", "North"
        SOUTH = "South", "South"
        EAST = "East", "East"
        WEST = "West", "West"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields = ['city', 'state', 'team_name'],
                name='unique_team_id'
            )
        ]

    def __str__(self):
        return f"{self.team_name} {self.city} {self.state}"

class Coach(models.Model):
    class RoleChoices(models.TextChoices):
        HEAD_COACH = "Head Coach", "Head Coach"
        OFFENSIVE_COORDINATOR = "Offensive Coordinator", "Offensive Coordinator"
        DEFENSIVE_COORDINATOR = "Defensive Coordinator", "Defensive Coordinator"
        SPECIAL_TEAMS_COORDINATOR = "Special Teams Coordinator", "Special Teams Coordinator"

    coach_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50, db_index=True)
    role = models.CharField(max_length=50, choices=RoleChoices.choices)
    team = models.ForeignKey(Team, on_delete=models.PROTECT, related_name='coaches')

    class Meta:
        verbose_name_plural = "Coaches"

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"