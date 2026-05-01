from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.seasons.models import Season, TeamSeason
from apps.teams.models import Team, Coach, CoachSeasonAssignment


TEST_COACH_ASSIGNMENTS = [
    {
        "team_abbreviation": "GB",
        "first_name": "Matt",
        "last_name": "LaFleur",
        "role": "Head Coach",
    },
    {
        "team_abbreviation": "GB",
        "first_name": "Adam",
        "last_name": "Stenavich",
        "role": "Offensive Coordinator",
    },
    {
        "team_abbreviation": "GB",
        "first_name": "Jeff",
        "last_name": "Hafley",
        "role": "Defensive Coordinator",
    },
    {
        "team_abbreviation": "GB",
        "first_name": "Rich",
        "last_name": "Bisaccia",
        "role": "Special Teams Coordinator",
    },
    {
        "team_abbreviation": "BUF",
        "first_name": "Sean",
        "last_name": "McDermott",
        "role": "Head Coach",
    },
    {
        "team_abbreviation": "BUF",
        "first_name": "Joe",
        "last_name": "Brady",
        "role": "Offensive Coordinator",
    },
    {
        "team_abbreviation": "BUF",
        "first_name": "Bobby",
        "last_name": "Babich",
        "role": "Defensive Coordinator",
    },
]


class Command(BaseCommand):
    help = "Seed test historical coach assignments by team season."

    def add_arguments(self, parser):
        parser.add_argument(
            "--year",
            type=int,
            default=2024,
            help="Season year to seed coach assignments for.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        year = options["year"]

        season, _ = Season.objects.get_or_create(year=year)

        created_coaches = 0
        updated_coaches = 0
        created_assignments = 0
        updated_assignments = 0

        for row in TEST_COACH_ASSIGNMENTS:
            team = self.get_team(row["team_abbreviation"])

            team_season, _ = TeamSeason.objects.update_or_create(
                team=team,
                season=season,
                defaults={
                    "conference": getattr(team, "conference", "") or "",
                    "division": getattr(team, "division", "") or "",
                },
            )

            coach, coach_created = Coach.objects.update_or_create(
                first_name=row["first_name"],
                last_name=row["last_name"],
                defaults={
                    "role": row["role"],
                    "team": team,
                },
            )

            if coach_created:
                created_coaches += 1
            else:
                updated_coaches += 1

            _, assignment_created = CoachSeasonAssignment.objects.update_or_create(
                coach=coach,
                team_season=team_season,
                role=row["role"],
                defaults={
                    "is_active": True,
                },
            )

            if assignment_created:
                created_assignments += 1
            else:
                updated_assignments += 1

        self.stdout.write(
            self.style.SUCCESS(
                "Seeded test coach assignments successfully.\n"
                f"Season: {year}\n"
                f"Coaches created: {created_coaches}, updated: {updated_coaches}\n"
                f"Assignments created: {created_assignments}, updated: {updated_assignments}"
            )
        )

    def get_team(self, abbreviation):
        try:
            return Team.objects.get(abbreviation=abbreviation)
        except Team.DoesNotExist:
            raise CommandError(
                f"Team with abbreviation '{abbreviation}' does not exist. "
                "Run your team seed command first."
            )