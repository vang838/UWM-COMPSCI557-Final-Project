from django.db import models

# Create your models here.
class Team(models.Model):
    class ConferenceChoices(models.TextChoices):
        AFC = "AFC", "AFC"
        NFC = "NFC", "NFC"

    class DivisonChoices(models.TextChoices):
        NORTH = "North", "North"
        SOUTH = "South", "South"
        EAST = "East", "East"
        WEST = "West", "West"

    team_id = models.AutoField(primary_key=True)
    team_name = models.CharField(max_length=100, unique=True)
    conference = models.CharField(max_length=3, choices=ConferenceChoices.choices)
    division = models.CharField(max_length=5, choices = DivisonChoices.choices)

    def __str__(self):
        return self.team_name

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

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"