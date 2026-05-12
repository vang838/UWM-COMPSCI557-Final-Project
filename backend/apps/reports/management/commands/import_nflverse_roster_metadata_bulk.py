# backend/apps/reports/management/commands/import_nflverse_roster_metadata_bulk.py

from __future__ import annotations

from dataclasses import dataclass

from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError

from apps.seasons.models import Season
from apps.teams.models import Team


DEFAULT_SOURCE_TEAM_OVERRIDES = {
    # nflverse uses LA for the Los Angeles Rams, while many local DBs use LAR.
    "LAR": "LA",
}


@dataclass
class BulkImportResult:
    year: int
    team: str
    source_team: str
    success: bool
    error: str = ""


class Command(BaseCommand):
    help = (
        "Bulk import nflverse roster metadata for multiple teams and seasons. "
        "This wraps import_nflverse_roster_metadata and updates player bio fields "
        "such as headshots, birth dates, college, height, and weight."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--years",
            type=int,
            nargs="+",
            help=(
                "Season years to import, for example: --years 2022 2023 2024. "
                "If omitted, all Season years in the database are used."
            ),
        )

        parser.add_argument(
            "--teams",
            nargs="+",
            help=(
                "Database team abbreviations to import, for example: --teams GB BUF LAR. "
                "If omitted, all teams with abbreviations are used."
            ),
        )

        parser.add_argument(
            "--exclude-teams",
            nargs="+",
            default=[],
            help="Database team abbreviations to skip.",
        )

        parser.add_argument(
            "--source-team-map",
            nargs="+",
            default=[],
            help=(
                "Optional DB-to-nflverse abbreviation overrides. "
                "Format: DB=SOURCE. Example: --source-team-map LAR=LA"
            ),
        )

        parser.add_argument(
            "--output-dir",
            help=(
                "Directory used by the single-team importer when downloading roster CSVs. "
                "If omitted, the single-team command uses its own default."
            ),
        )

        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview changes without updating the database.",
        )

        parser.add_argument(
            "--force-download",
            action="store_true",
            help="Force roster CSV downloads even if local files already exist.",
        )

        parser.add_argument(
            "--fail-fast",
            action="store_true",
            help="Stop immediately when one team/year import fails.",
        )

    def handle(self, *args, **options):
        years = self.get_years(options["years"])
        teams = self.get_teams(options["teams"], options["exclude_teams"])
        source_team_overrides = self.get_source_team_overrides(
            options["source_team_map"]
        )

        dry_run = options["dry_run"]
        force_download = options["force_download"]
        fail_fast = options["fail_fast"]
        output_dir = options.get("output_dir")

        if not years:
            raise CommandError(
                "No seasons found. Create Season rows first or pass --years explicitly."
            )

        if not teams:
            raise CommandError(
                "No teams found. Seed teams first or pass --teams explicitly."
            )

        self.stdout.write("")
        self.stdout.write("Bulk nflverse roster metadata import")
        self.stdout.write("-" * 56)
        self.stdout.write(f"Years: {', '.join(str(year) for year in years)}")
        self.stdout.write(f"Teams: {', '.join(teams)}")
        self.stdout.write(f"Dry run: {dry_run}")
        self.stdout.write(f"Force download: {force_download}")
        self.stdout.write("")

        results: list[BulkImportResult] = []

        for year in years:
            for team in teams:
                source_team = source_team_overrides.get(team, team)

                self.stdout.write(
                    self.style.NOTICE(
                        f"Importing {team} {year} using source team {source_team}..."
                    )
                )

                command_kwargs = {
                    "team": team,
                    "source_team": source_team,
                    "year": year,
                    "dry_run": dry_run,
                    "force_download": force_download,
                    "verbosity": options.get("verbosity", 1),
                }

                if output_dir:
                    command_kwargs["output_dir"] = output_dir

                try:
                    call_command(
                        "import_nflverse_roster_metadata",
                        **command_kwargs,
                    )

                    results.append(
                        BulkImportResult(
                            year=year,
                            team=team,
                            source_team=source_team,
                            success=True,
                        )
                    )
                except Exception as error:
                    error_message = str(error)

                    results.append(
                        BulkImportResult(
                            year=year,
                            team=team,
                            source_team=source_team,
                            success=False,
                            error=error_message,
                        )
                    )

                    self.stderr.write(
                        self.style.ERROR(
                            f"Failed {team} {year}: {error_message}"
                        )
                    )

                    if fail_fast:
                        raise CommandError(
                            f"Bulk import stopped after failure on {team} {year}."
                        ) from error

                self.stdout.write("")

        self.print_summary(results)

        failed_results = [result for result in results if not result.success]

        if failed_results:
            raise CommandError(
                f"Bulk import completed with {len(failed_results)} failure(s). "
                "Review the summary above."
            )

    def get_years(self, requested_years: list[int] | None) -> list[int]:
        if requested_years:
            return sorted(set(requested_years))

        return list(
            Season.objects.order_by("year").values_list("year", flat=True)
        )

    def get_teams(
        self,
        requested_teams: list[str] | None,
        excluded_teams: list[str],
    ) -> list[str]:
        excluded = {team.strip().upper() for team in excluded_teams if team.strip()}

        if requested_teams:
            teams = [
                team.strip().upper()
                for team in requested_teams
                if team.strip()
            ]
        else:
            teams = list(
                Team.objects.exclude(abbreviation="")
                .order_by("abbreviation")
                .values_list("abbreviation", flat=True)
            )

            teams = [team.strip().upper() for team in teams if team]

        return [team for team in teams if team not in excluded]

    def get_source_team_overrides(self, raw_mappings: list[str]) -> dict[str, str]:
        overrides = dict(DEFAULT_SOURCE_TEAM_OVERRIDES)

        for mapping in raw_mappings:
            if "=" not in mapping:
                raise CommandError(
                    f"Invalid --source-team-map value '{mapping}'. "
                    "Use DB=SOURCE, for example LAR=LA."
                )

            db_team, source_team = mapping.split("=", maxsplit=1)

            db_team = db_team.strip().upper()
            source_team = source_team.strip().upper()

            if not db_team or not source_team:
                raise CommandError(
                    f"Invalid --source-team-map value '{mapping}'. "
                    "Both DB and SOURCE abbreviations are required."
                )

            overrides[db_team] = source_team

        return overrides

    def print_summary(self, results: list[BulkImportResult]) -> None:
        successful_results = [result for result in results if result.success]
        failed_results = [result for result in results if not result.success]

        self.stdout.write("")
        self.stdout.write("Bulk import summary")
        self.stdout.write("-" * 56)
        self.stdout.write(f"Total jobs: {len(results)}")
        self.stdout.write(
            self.style.SUCCESS(f"Succeeded: {len(successful_results)}")
        )

        if failed_results:
            self.stdout.write(
                self.style.ERROR(f"Failed: {len(failed_results)}")
            )

            for result in failed_results:
                self.stdout.write(
                    self.style.ERROR(
                        f"- {result.team} {result.year} "
                        f"(source {result.source_team}): {result.error}"
                    )
                )
        else:
            self.stdout.write(self.style.SUCCESS("Failed: 0"))