from django.core.management.base import BaseCommand
from django.db import transaction

from apps.teams.models import Team
from apps.seasons.models import Season, TeamSeason
from apps.reports.importers.nflverse_roster_metadata_importer import (
    import_nflverse_roster_metadata,
)


class Command(BaseCommand):
    help = "Import nflverse player headshot URLs for all teams from 2022 to 2024."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            required=True,
            help="Path to the nflverse roster CSV file.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Run import without saving changes.",
        )

    def handle(self, *args, **options):
        file_path = options["file"]
        dry_run = options["dry_run"]

        years = [2022, 2023, 2024]

        total_updated = 0
        total_unchanged = 0
        total_missing = 0
        total_ambiguous = 0
        total_skipped = 0

        teams = Team.objects.exclude(abbreviation="").order_by("abbreviation")

        with transaction.atomic():
            for year in years:
                for team in teams:
                    team_season_exists = TeamSeason.objects.filter(
                        team=team,
                        season__year=year,
                    ).exists()

                    if not team_season_exists:
                        self.stdout.write(
                            self.style.WARNING(
                                f"Skipped {year} {team.abbreviation}: TeamSeason does not exist."
                            )
                        )
                        total_skipped += 1
                        continue

                    try:
                        summary = import_nflverse_roster_metadata(
                            file_path=file_path,
                            team=team.abbreviation,
                            year=year,
                            dry_run=dry_run,
                        )
                    except Season.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(
                                f"Skipped {year} {team.abbreviation}: Season does not exist."
                            )
                        )
                        total_skipped += 1
                        continue
                    except Team.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(
                                f"Skipped {year} {team.abbreviation}: Team does not exist."
                            )
                        )
                        total_skipped += 1
                        continue
                    except TeamSeason.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(
                                f"Skipped {year} {team.abbreviation}: TeamSeason does not exist."
                            )
                        )
                        total_skipped += 1
                        continue

                    total_updated += summary.players_updated
                    total_unchanged += summary.players_unchanged
                    total_missing += summary.missing_matches
                    total_ambiguous += summary.ambiguous_matches

                    self.stdout.write(
                        f"{year} {team.abbreviation}: "
                        f"updated={summary.players_updated}, "
                        f"unchanged={summary.players_unchanged}, "
                        f"missing={summary.missing_matches}, "
                        f"ambiguous={summary.ambiguous_matches}, "
                        f"matched_rows={summary.rows_matched_team_year}"
                    )

        self.stdout.write(
            self.style.SUCCESS(
                "All player image imports complete. "
                f"Updated: {total_updated}, "
                f"Unchanged: {total_unchanged}, "
                f"Missing matches: {total_missing}, "
                f"Ambiguous matches: {total_ambiguous}, "
                f"Skipped team-seasons: {total_skipped}"
            )
        )