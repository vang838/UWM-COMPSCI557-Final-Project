# backend/apps/reports/management/commands/import_nflverse_player_stats_bulk.py

from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.reports.importers.nflverse_downloader import (
    NflverseDownloadError,
    download_asset,
)
from apps.reports.importers.nflverse_player_stats_importer import (
    NflverseImportError,
    import_nflverse_player_stats,
)


class Command(BaseCommand):
    help = "Download and import nflverse player stats for multiple seasons."

    def add_arguments(self, parser):
        parser.add_argument(
            "--team",
            required=True,
            help="NFL team abbreviation to import. Example: GB, CHI, NYJ",
        )

        parser.add_argument(
            "--start-year",
            required=True,
            type=int,
            help="First season year to import. Example: 2020",
        )

        parser.add_argument(
            "--end-year",
            required=True,
            type=int,
            help="Last season year to import. Example: 2024",
        )

        parser.add_argument(
            "--season-type",
            default="REG",
            help="Season type to import. Default: REG",
        )

        parser.add_argument(
            "--output-dir",
            default="data/imports/nflverse",
            help="Directory where nflverse CSV files should be stored.",
        )

        parser.add_argument(
            "--include-zero-values",
            action="store_true",
            help="Import zero-value stats. By default, zero-value stats are skipped.",
        )

        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Run each import and report changes without committing to the database.",
        )

        parser.add_argument(
            "--force-download",
            action="store_true",
            help="Download the CSV again even if it already exists locally.",
        )

    def handle(self, *args, **options):
        team = options["team"].upper()
        start_year = options["start_year"]
        end_year = options["end_year"]
        season_type = options["season_type"].upper()
        dry_run = options["dry_run"]
        force_download = options["force_download"]
        include_zero_values = options["include_zero_values"]

        if start_year > end_year:
            raise CommandError("--start-year cannot be greater than --end-year")

        output_dir = Path(settings.BASE_DIR) / options["output_dir"]
        output_dir.mkdir(parents=True, exist_ok=True)

        yearly_summaries = []
        total_rows_matched = 0
        total_players_created = 0
        total_rosters_created = 0
        total_stats_created = 0
        total_stats_updated = 0
        total_errors = 0

        for year in range(start_year, end_year + 1):
            contains = f"stats_player_reg_{year}"
            expected_file = output_dir / f"{contains}.csv"

            self.stdout.write("")
            self.stdout.write("=" * 64)
            self.stdout.write(f"Processing {team} {year} {season_type}")
            self.stdout.write("=" * 64)

            try:
                if force_download or not expected_file.exists():
                    self.stdout.write(f"Downloading nflverse asset containing '{contains}'...")

                    csv_path = download_asset(
                        tag="stats_player",
                        contains=contains,
                        output_dir=output_dir,
                        extension=".csv",
                    )
                else:
                    csv_path = expected_file
                    self.stdout.write(f"Using existing file: {csv_path}")

                summary = import_nflverse_player_stats(
                    file_path=csv_path,
                    team_abbreviation=team,
                    year=year,
                    season_type=season_type,
                    skip_zero_values=not include_zero_values,
                    dry_run=dry_run,
                )

                yearly_summaries.append(summary)

                total_rows_matched += int(summary.get("rows_matched", 0))
                total_players_created += int(summary.get("players_created", 0))
                total_rosters_created += int(summary.get("rosters_created", 0))
                total_stats_created += int(summary.get("stats_created", 0))
                total_stats_updated += int(summary.get("stats_updated", 0))
                total_errors += int(summary.get("errors", 0))

                for key, value in summary.items():
                    self.stdout.write(f"{key}: {value}")

            except (NflverseDownloadError, NflverseImportError) as error:
                total_errors += 1
                self.stderr.write(self.style.ERROR(f"{year} failed: {error}"))

            except Exception as error:
                total_errors += 1
                self.stderr.write(
                    self.style.ERROR(f"{year} failed with unexpected error: {error}")
                )

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Bulk nflverse import summary"))
        self.stdout.write("-" * 64)
        self.stdout.write(f"team: {team}")
        self.stdout.write(f"start_year: {start_year}")
        self.stdout.write(f"end_year: {end_year}")
        self.stdout.write(f"season_type: {season_type}")
        self.stdout.write(f"dry_run: {dry_run}")
        self.stdout.write(f"years_attempted: {end_year - start_year + 1}")
        self.stdout.write(f"years_succeeded: {len(yearly_summaries)}")
        self.stdout.write(f"total_rows_matched: {total_rows_matched}")
        self.stdout.write(f"total_players_created: {total_players_created}")
        self.stdout.write(f"total_rosters_created: {total_rosters_created}")
        self.stdout.write(f"total_stats_created: {total_stats_created}")
        self.stdout.write(f"total_stats_updated: {total_stats_updated}")
        self.stdout.write(f"total_errors: {total_errors}")

        if dry_run:
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING("Dry run complete. No database changes were committed.")
            )