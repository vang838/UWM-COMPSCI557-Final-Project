# backend/apps/reports/management/commands/import_nflverse_roster_metadata.py

from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.reports.importers.nflverse_downloader import download_asset
from apps.reports.importers.nflverse_roster_metadata_importer import (
    import_nflverse_roster_metadata,
)


class Command(BaseCommand):
    help = "Import nflverse roster metadata such as player headshot URLs."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            default="",
            help="Path to a local nflverse roster CSV. If omitted, the command downloads roster_YEAR.csv.",
        )

        parser.add_argument(
            "--team",
            type=str,
            required=True,
            help="Database team abbreviation, for example GB, CHI, LAR.",
        )

        parser.add_argument(
            "--source-team",
            type=str,
            default="",
            help="Optional nflverse team abbreviation if different from your DB abbreviation. Example: source-team LA for DB team LAR.",
        )

        parser.add_argument(
            "--year",
            type=int,
            required=True,
            help="Season year, for example 2024.",
        )

        parser.add_argument(
            "--output-dir",
            type=str,
            default="data/imports/nflverse",
            help="Directory used when downloading roster CSV files.",
        )

        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview changes without updating the database.",
        )

        parser.add_argument(
            "--force-download",
            action="store_true",
            help="Download the roster CSV even if a local file already exists.",
        )

    def handle(self, *args, **options):
        team = options["team"].strip().upper()
        source_team = options["source_team"].strip().upper() or None
        year = options["year"]
        dry_run = options["dry_run"]
        output_dir = Path(options["output_dir"])
        file_option = options["file"].strip()
        force_download = options["force_download"]

        try:
            if file_option:
                file_path = Path(file_option)
            else:
                output_dir.mkdir(parents=True, exist_ok=True)
                expected_file = output_dir / f"roster_{year}.csv"

                if expected_file.exists() and not force_download:
                    file_path = expected_file
                    self.stdout.write(f"Using existing file: {file_path.resolve()}")
                else:
                    self.stdout.write(
                        f"Downloading nflverse roster asset containing 'roster_{year}'..."
                    )
                    file_path = download_asset(
                        tag="rosters",
                        contains=f"roster_{year}",
                        output_dir=output_dir,
                        extension=".csv",
                    )

            summary = import_nflverse_roster_metadata(
                file_path=file_path,
                team=team,
                source_team=source_team,
                year=year,
                dry_run=dry_run,
            )

        except Exception as error:
            raise CommandError(str(error)) from error

        self.stdout.write("")
        self.stdout.write("nflverse roster metadata import summary")
        self.stdout.write("-" * 56)

        for key, value in summary.as_dict().items():
            self.stdout.write(f"{key}: {value}")

        if dry_run:
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING("Dry run complete. No database changes were committed.")
            )
        else:
            self.stdout.write("")
            self.stdout.write(
                self.style.SUCCESS("Roster metadata import complete.")
            )