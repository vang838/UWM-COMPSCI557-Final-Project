from django.db import models

# Create your models here.
class Team(models.Model):
    team_id = models.AutoField(primary_key=True)
    team_name = models.CharField(max_length=100, unique=True)
    city = models.CharField(max_length=100, blank=True, default="")
    state = models.CharField(max_length=2, blank=True, default="")
    conference = models.CharField(max_length=50)
    division = models.CharField(max_length=50)

    abbreviation = models.CharField(max_length=5, blank=True)
    primary_color = models.CharField(max_length=7, default="#1a3d28")
    secondary_color = models.CharField(max_length=7, default="#f0c040")
    text_color = models.CharField(max_length=7, default="#ffffff")

    def __str__(self):
        return self.team_name

class Coach(models.Model):
    coach_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    role = models.CharField(max_length=50)  # Head Coach, OC, DC, etc
    team = models.ForeignKey(Team, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"