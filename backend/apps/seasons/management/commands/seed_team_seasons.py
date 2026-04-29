# backend/apps/seasons/management/commands/seed_team_seasons.py

from django.core.management.base import BaseCommand

from apps.seasons.models import Season, TeamSeason
from apps.teams.models import Team


class Command(BaseCommand):
    help = "Create TeamSeason rows for every team in one season or all existing seasons."

    def add_arguments(self, parser):
        parser.add_argument(
            "--year",
            type=int,
            help="Optional season year to seed. If provided, the season is created if missing.",
        )

    def handle(self, *args, **options):
        year = options.get("year")

        teams = Team.objects.all()

        if not teams.exists():
            self.stdout.write(
                self.style.WARNING(
                    "No teams found. Run your NFL team seed command first."
                )
            )
            return

        if year:
            season, _ = Season.objects.get_or_create(year=year)
            seasons = [season]
        else:
            seasons = list(Season.objects.all())

        if not seasons:
            self.stdout.write(
                self.style.WARNING(
                    "No seasons found. Create a season first, or run with --year 2024."
                )
            )
            return

        created_count = 0
        updated_count = 0

        for season in seasons:
            for team in teams:
                _, created = TeamSeason.objects.update_or_create(
                    team=team,
                    season=season,
                    defaults={
                        "conference": getattr(team, "conference", "") or "",
                        "division": getattr(team, "division", "") or "",
                    },
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded TeamSeason rows. Created: {created_count}, Updated: {updated_count}"
            )
        )