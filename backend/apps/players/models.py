from django.db import models
from django.utils import timezone

from apps.teams.models import Team


class Player(models.Model):
    player_id = models.AutoField(primary_key=True)

    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    position = models.CharField(max_length=20)

    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name="players",
    )

    date_of_birth = models.DateField(null=True, blank=True)
    college = models.CharField(max_length=100, blank=True)

    height = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    weight = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)

    headshot_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)

    @property
    def age(self):
        if not self.date_of_birth:
            return None

        today = timezone.localdate()

        return (
            today.year
            - self.date_of_birth.year
            - (
                (today.month, today.day)
                < (self.date_of_birth.month, self.date_of_birth.day)
            )
        )

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()