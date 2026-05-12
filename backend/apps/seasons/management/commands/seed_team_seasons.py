# backend/apps/seasons/management/commands/seed_team_seasons.py

from django.core.management.base import BaseCommand

from apps.seasons.models import Season, TeamSeason
from apps.teams.models import Team


NFL_ALIGNMENT = {
    # AFC East
    "BUF": {"conference": "AFC", "division": "East"},
    "MIA": {"conference": "AFC", "division": "East"},
    "NE": {"conference": "AFC", "division": "East"},
    "NYJ": {"conference": "AFC", "division": "East"},

    # AFC North
    "BAL": {"conference": "AFC", "division": "North"},
    "CIN": {"conference": "AFC", "division": "North"},
    "CLE": {"conference": "AFC", "division": "North"},
    "PIT": {"conference": "AFC", "division": "North"},

    # AFC South
    "HOU": {"conference": "AFC", "division": "South"},
    "IND": {"conference": "AFC", "division": "South"},
    "JAX": {"conference": "AFC", "division": "South"},
    "TEN": {"conference": "AFC", "division": "South"},

    # AFC West
    "DEN": {"conference": "AFC", "division": "West"},
    "KC": {"conference": "AFC", "division": "West"},
    "LV": {"conference": "AFC", "division": "West"},
    "LAC": {"conference": "AFC", "division": "West"},

    # NFC East
    "DAL": {"conference": "NFC", "division": "East"},
    "NYG": {"conference": "NFC", "division": "East"},
    "PHI": {"conference": "NFC", "division": "East"},
    "WAS": {"conference": "NFC", "division": "East"},

    # NFC North
    "CHI": {"conference": "NFC", "division": "North"},
    "DET": {"conference": "NFC", "division": "North"},
    "GB": {"conference": "NFC", "division": "North"},
    "MIN": {"conference": "NFC", "division": "North"},

    # NFC South
    "ATL": {"conference": "NFC", "division": "South"},
    "CAR": {"conference": "NFC", "division": "South"},
    "NO": {"conference": "NFC", "division": "South"},
    "TB": {"conference": "NFC", "division": "South"},

    # NFC West
    "ARI": {"conference": "NFC", "division": "West"},
    "LAR": {"conference": "NFC", "division": "West"},
    "SF": {"conference": "NFC", "division": "West"},
    "SEA": {"conference": "NFC", "division": "West"},
}


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
        skipped_count = 0

        for season in seasons:
            for team in teams:
                abbreviation = (team.abbreviation or "").strip().upper()
                alignment = NFL_ALIGNMENT.get(abbreviation)

                if not alignment:
                    skipped_count += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f"Skipping {team}: no alignment found for abbreviation '{abbreviation}'."
                        )
                    )
                    continue

                _, created = TeamSeason.objects.update_or_create(
                    team=team,
                    season=season,
                    defaults={
                        "conference": alignment["conference"],
                        "division": alignment["division"],
                    },
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded TeamSeason rows. Created: {created_count}, "
                f"Updated: {updated_count}, Skipped: {skipped_count}"
            )
        )