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
from apps.teams.models import Team


class Command(BaseCommand):
    help = "Download and import nflverse player stats for multiple teams and seasons."

    def add_arguments(self, parser):
        team_group = parser.add_mutually_exclusive_group(required=True)

        team_group.add_argument(
            "--team",
            help="Single NFL team abbreviation to import. Example: GB",
        )

        team_group.add_argument(
            "--teams",
            help="Comma-separated NFL team abbreviations. Example: GB,CHI,DET,MIN",
        )

        team_group.add_argument(
            "--all-existing-teams",
            action="store_true",
            help="Import every team that already exists in the Team table and has an abbreviation.",
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
            help="Download each CSV again even if it already exists locally.",
        )

        parser.add_argument(
            "--stop-on-error",
            action="store_true",
            help="Stop the bulk import immediately if one team/year fails.",
        )

        parser.add_argument(
            "--import-all-numeric",
            action="store_true",
            help="Import all numeric nflverse stat columns instead of only the curated stat map.",
        )

    def get_requested_teams(self, options) -> list[str]:
        if options.get("team"):
            return [options["team"].strip().upper()]

        if options.get("teams"):
            teams = [
                team.strip().upper()
                for team in options["teams"].split(",")
                if team.strip()
            ]

            if not teams:
                raise CommandError("--teams was provided, but no valid team abbreviations were found.")

            return teams

        if options.get("all_existing_teams"):
            teams = list(
                Team.objects.exclude(abbreviation="")
                .values_list("abbreviation", flat=True)
                .order_by("abbreviation")
            )

            teams = [team.strip().upper() for team in teams if team and team.strip()]

            if not teams:
                raise CommandError(
                    "No teams with abbreviations exist in the database. "
                    "Create/import Team records before using --all-existing-teams."
                )

            return teams

        raise CommandError("Choose --team, --teams, or --all-existing-teams.")

    def handle(self, *args, **options):
        team_abbreviations = self.get_requested_teams(options)

        start_year = options["start_year"]
        end_year = options["end_year"]
        season_type = options["season_type"].upper()
        dry_run = options["dry_run"]
        force_download = options["force_download"]
        include_zero_values = options["include_zero_values"]
        stop_on_error = options["stop_on_error"]

        if start_year > end_year:
            raise CommandError("--start-year cannot be greater than --end-year")

        output_dir = Path(settings.BASE_DIR) / options["output_dir"]
        output_dir.mkdir(parents=True, exist_ok=True)

        years_attempted = 0
        team_year_attempts = 0
        team_year_successes = 0
        total_rows_matched = 0
        total_players_created = 0
        total_players_updated = 0
        total_team_seasons_created = 0
        total_rosters_created = 0
        total_stats_created = 0
        total_stats_updated = 0
        total_errors = 0

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Bulk nflverse player stats import"))
        self.stdout.write("-" * 72)
        self.stdout.write(f"teams: {', '.join(team_abbreviations)}")
        self.stdout.write(f"years: {start_year}-{end_year}")
        self.stdout.write(f"season_type: {season_type}")
        self.stdout.write(f"dry_run: {dry_run}")

        for year in range(start_year, end_year + 1):
            years_attempted += 1

            contains = f"stats_player_reg_{year}"
            expected_file = output_dir / f"{contains}.csv"

            self.stdout.write("")
            self.stdout.write("=" * 72)
            self.stdout.write(f"Preparing nflverse file for {year} {season_type}")
            self.stdout.write("=" * 72)

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

            except NflverseDownloadError as error:
                total_errors += 1
                self.stderr.write(self.style.ERROR(f"{year} download failed: {error}"))

                if stop_on_error:
                    raise CommandError(str(error)) from error

                continue

            for team in team_abbreviations:
                team_year_attempts += 1

                self.stdout.write("")
                self.stdout.write(f"Processing {team} {year} {season_type}")
                self.stdout.write("-" * 72)

                try:
                    summary = import_nflverse_player_stats(
                        file_path=csv_path,
                        team_abbreviation=team,
                        year=year,
                        season_type=season_type,
                        skip_zero_values=not include_zero_values,
                        dry_run=dry_run,
                    )

                    team_year_successes += 1

                    total_rows_matched += int(summary.get("rows_matched", 0))
                    total_players_created += int(summary.get("players_created", 0))
                    total_players_updated += int(summary.get("players_updated", 0))
                    total_team_seasons_created += int(summary.get("team_seasons_created", 0))
                    total_rosters_created += int(summary.get("rosters_created", 0))
                    total_stats_created += int(summary.get("stats_created", 0))
                    total_stats_updated += int(summary.get("stats_updated", 0))
                    total_errors += int(summary.get("errors", 0))

                    self.stdout.write(
                        f"rows_matched={summary.get('rows_matched', 0)} | "
                        f"players_created={summary.get('players_created', 0)} | "
                        f"players_updated={summary.get('players_updated', 0)} | "
                        f"team_seasons_created={summary.get('team_seasons_created', 0)} | "
                        f"rosters_created={summary.get('rosters_created', 0)} | "
                        f"stats_created={summary.get('stats_created', 0)} | "
                        f"stats_updated={summary.get('stats_updated', 0)} | "
                        f"stats_skipped_zero={summary.get('stats_skipped_zero', 0)}"
                    )

                except (NflverseImportError, Exception) as error:
                    total_errors += 1

                    message = f"{team} {year} failed: {error}"
                    self.stderr.write(self.style.ERROR(message))

                    if stop_on_error:
                        raise CommandError(message) from error

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Bulk nflverse import summary"))
        self.stdout.write("-" * 72)
        self.stdout.write(f"teams_requested: {len(team_abbreviations)}")
        self.stdout.write(f"team_list: {', '.join(team_abbreviations)}")
        self.stdout.write(f"start_year: {start_year}")
        self.stdout.write(f"end_year: {end_year}")
        self.stdout.write(f"season_type: {season_type}")
        self.stdout.write(f"dry_run: {dry_run}")
        self.stdout.write(f"years_attempted: {years_attempted}")
        self.stdout.write(f"team_year_attempts: {team_year_attempts}")
        self.stdout.write(f"team_year_successes: {team_year_successes}")
        self.stdout.write(f"total_rows_matched: {total_rows_matched}")
        self.stdout.write(f"total_players_created: {total_players_created}")
        self.stdout.write(f"total_players_updated: {total_players_updated}")
        self.stdout.write(f"total_team_seasons_created: {total_team_seasons_created}")
        self.stdout.write(f"total_rosters_created: {total_rosters_created}")
        self.stdout.write(f"total_stats_created: {total_stats_created}")
        self.stdout.write(f"total_stats_updated: {total_stats_updated}")
        self.stdout.write(f"total_errors: {total_errors}")

        if dry_run:
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING("Dry run complete. No database changes were committed.")
            )