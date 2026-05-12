from django.db import models
from django.utils import timezone

class Team(models.Model):
    team_id = models.AutoField(primary_key=True)
    team_name = models.CharField(max_length=100, unique=True)

    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=2, blank=True)

    abbreviation = models.CharField(max_length=5, blank=True)
    primary_color = models.CharField(max_length=7, default="#1a3d28")
    secondary_color = models.CharField(max_length=7, default="#f0c040")
    text_color = models.CharField(max_length=7, default="#ffffff")

    def __str__(self):
        return f"{self.city} {self.team_name}".strip() or self.team_name


class Coach(models.Model):
    coach_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    date_of_birth = models.DateField(null=True, blank=True)
    college = models.CharField(max_length=100, blank=True)
    high_school = models.CharField(max_length=100, blank=True)
    birth_place = models.CharField(max_length=100, blank=True)
    headshot_url = models.URLField(blank=True)
    external_source_url = models.URLField(blank=True)

    # Legacy/default role. Historical role should come from CoachSeasonAssignment.
    role = models.CharField(max_length=50, blank=True)

    # Legacy/current team reference. Historical team should come from CoachSeasonAssignment.
    team = models.ForeignKey(
        Team,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="coaches",
    )

    @property
    def age(self):
        if not self.date_of_birth:
            return None

        today = timezone.localdate()

        return (
                today.year
                - self.date_of_birth.year
                - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        )

    def __str__(self):
        full_name = f"{self.first_name} {self.last_name}".strip()
        return f"{full_name} ({self.role})" if self.role else full_name


class CoachSeasonAssignment(models.Model):
    assignment_id = models.AutoField(primary_key=True)

    coach = models.ForeignKey(
        Coach,
        on_delete=models.CASCADE,
        related_name="season_assignments",
    )

    team_season = models.ForeignKey(
        "seasons.TeamSeason",
        on_delete=models.CASCADE,
        related_name="coach_assignments",
    )

    role = models.CharField(max_length=75)
    is_active = models.BooleanField(default=True)

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["coach", "team_season", "role"],
                name="unique_coach_team_season_role",
            )
        ]
        ordering = [
            "team_season__season__year",
            "team_season__team__team_name",
            "role",
            "coach__last_name",
        ]

    def __str__(self):
        return (
            f"{self.coach.first_name} {self.coach.last_name} - "
            f"{self.role} - {self.team_season}"
        )