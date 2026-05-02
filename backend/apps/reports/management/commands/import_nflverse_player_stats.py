from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.reports.importers.nflverse_player_stats_importer import (
    NflverseImportError,
    import_nflverse_player_stats,
)


class Command(BaseCommand):
    help = "Import nflverse season-level player stats into GridTracker."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            required=True,
            help="Path to the nflverse CSV file. Example: data/imports/nflverse/stats_player_reg_2024.csv",
        )

        parser.add_argument(
            "--team",
            required=True,
            help="NFL team abbreviation to import. Example: GB, CHI, NYJ",
        )

        parser.add_argument(
            "--year",
            required=True,
            type=int,
            help="Season year to import. Example: 2024",
        )

        parser.add_argument(
            "--season-type",
            default="REG",
            help="Season type to import. Default: REG",
        )

        parser.add_argument(
            "--include-zero-values",
            action="store_true",
            help="Import zero-value stats. By default, zero-value stats are skipped.",
        )

        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Run the import and report changes without committing to the database.",
        )

    def handle(self, *args, **options):
        input_path = Path(options["file"])

        if not input_path.is_absolute():
            input_path = Path(settings.BASE_DIR) / input_path

        try:
            summary = import_nflverse_player_stats(
                file_path=input_path,
                team_abbreviation=options["team"],
                year=options["year"],
                season_type=options["season_type"],
                skip_zero_values=not options["include_zero_values"],
                dry_run=options["dry_run"],
            )

        except NflverseImportError as error:
            raise CommandError(str(error)) from error
        except Exception as error:
            raise CommandError(f"Unexpected import error: {error}") from error

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("nflverse player stats import summary"))
        self.stdout.write("-" * 48)

        for key, value in summary.items():
            self.stdout.write(f"{key}: {value}")

        if options["dry_run"]:
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING("Dry run complete. No database changes were committed.")
            )