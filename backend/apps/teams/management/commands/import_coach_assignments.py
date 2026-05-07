# backend/apps/teams/management/commands/import_coach_assignments.py

from __future__ import annotations

import csv
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.seasons.models import Season, TeamSeason
from apps.teams.models import Coach, CoachSeasonAssignment, Team


ROLE_ALIASES = {
    "hc": "Head Coach",
    "head coach": "Head Coach",
    "head": "Head Coach",
    "oc": "Offensive Coordinator",
    "offensive coordinator": "Offensive Coordinator",
    "dc": "Defensive Coordinator",
    "defensive coordinator": "Defensive Coordinator",
    "st": "Special Teams Coordinator",
    "stc": "Special Teams Coordinator",
    "special teams": "Special Teams Coordinator",
    "special teams coordinator": "Special Teams Coordinator",
}

CANONICAL_ROLES = {
    "Head Coach",
    "Offensive Coordinator",
    "Defensive Coordinator",
    "Special Teams Coordinator",
}


@dataclass
class ImportSummary:
    rows_read: int = 0
    rows_imported: int = 0
    rows_skipped: int = 0
    coaches_created: int = 0
    coaches_updated: int = 0
    assignments_created: int = 0
    assignments_updated: int = 0


class Command(BaseCommand):
    help = (
        "Import historical NFL coach assignments from a CSV file. "
        "Expected roles include Head Coach, Offensive Coordinator, "
        "Defensive Coordinator, and Special Teams Coordinator."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            required=True,
            help="Path to coach assignment CSV file.",
        )

        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview the import without committing database changes.",
        )

        parser.add_argument(
            "--allow-noncanonical-roles",
            action="store_true",
            help="Allow roles outside the standard four coaching roles.",
        )

        parser.add_argument(
            "--skip-missing-teamseason",
            action="store_true",
            help=(
                "Skip rows where TeamSeason does not exist instead of failing. "
                "Recommended only for partial imports."
            ),
        )

    @transaction.atomic
    def handle(self, *args, **options):
        csv_path = Path(options["file"])
        dry_run = options["dry_run"]
        allow_noncanonical_roles = options["allow_noncanonical_roles"]
        skip_missing_teamseason = options["skip_missing_teamseason"]

        if not csv_path.exists():
            raise CommandError(f"CSV file does not exist: {csv_path}")

        summary = ImportSummary()
        touched_coach_ids: set[int] = set()

        with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
            reader = csv.DictReader(csv_file)

            required_columns = {
                "year",
                "team_abbreviation",
                "first_name",
                "last_name",
                "role",
            }

            missing_columns = required_columns - set(reader.fieldnames or [])

            if missing_columns:
                raise CommandError(
                    "CSV is missing required column(s): "
                    + ", ".join(sorted(missing_columns))
                )

            for row_number, row in enumerate(reader, start=2):
                summary.rows_read += 1

                try:
                    result = self.import_row(
                        row=row,
                        row_number=row_number,
                        allow_noncanonical_roles=allow_noncanonical_roles,
                        skip_missing_teamseason=skip_missing_teamseason,
                    )
                except CommandError:
                    raise
                except Exception as error:
                    raise CommandError(
                        f"Failed to import row {row_number}: {error}"
                    ) from error

                if result is None:
                    summary.rows_skipped += 1
                    continue

                coach, coach_created, assignment_created = result

                touched_coach_ids.add(coach.coach_id)

                summary.rows_imported += 1

                if coach_created:
                    summary.coaches_created += 1
                else:
                    summary.coaches_updated += 1

                if assignment_created:
                    summary.assignments_created += 1
                else:
                    summary.assignments_updated += 1

        self.update_default_coach_fields(touched_coach_ids)

        if dry_run:
            transaction.set_rollback(True)

        self.print_summary(summary, dry_run)

    def import_row(
        self,
        row: dict[str, str],
        row_number: int,
        allow_noncanonical_roles: bool,
        skip_missing_teamseason: bool,
    ) -> tuple[Coach, bool, bool] | None:
        year = self.parse_year(row.get("year"), row_number)
        team_abbreviation = self.required_value(
            row.get("team_abbreviation"),
            "team_abbreviation",
            row_number,
        ).upper()

        first_name = self.required_value(
            row.get("first_name"),
            "first_name",
            row_number,
        )
        last_name = self.required_value(
            row.get("last_name"),
            "last_name",
            row_number,
        )

        role = self.normalize_role(
            self.required_value(row.get("role"), "role", row_number)
        )

        if not allow_noncanonical_roles and role not in CANONICAL_ROLES:
            raise CommandError(
                f"Row {row_number}: role '{role}' is not one of "
                f"{', '.join(sorted(CANONICAL_ROLES))}. "
                "Use --allow-noncanonical-roles to allow it."
            )

        is_active = self.parse_bool(row.get("is_active"), default=True)
        start_date = self.parse_optional_date(row.get("start_date"), row_number)
        end_date = self.parse_optional_date(row.get("end_date"), row_number)

        try:
            team = Team.objects.get(abbreviation=team_abbreviation)
        except Team.DoesNotExist as error:
            raise CommandError(
                f"Row {row_number}: team abbreviation '{team_abbreviation}' "
                "does not exist. Seed teams first."
            ) from error

        try:
            season = Season.objects.get(year=year)
        except Season.DoesNotExist as error:
            raise CommandError(
                f"Row {row_number}: season year '{year}' does not exist. "
                "Seed seasons first."
            ) from error

        try:
            team_season = TeamSeason.objects.get(team=team, season=season)
        except TeamSeason.DoesNotExist as error:
            message = (
                f"Row {row_number}: TeamSeason does not exist for "
                f"{team_abbreviation} {year}. Run seed_team_seasons first."
            )

            if skip_missing_teamseason:
                self.stderr.write(self.style.WARNING(message))
                return None

            raise CommandError(message) from error

        coach, coach_created = Coach.objects.get_or_create(
            first_name=first_name,
            last_name=last_name,
            defaults={
                "role": role,
                "team": team,
            },
        )

        assignment, assignment_created = CoachSeasonAssignment.objects.update_or_create(
            coach=coach,
            team_season=team_season,
            role=role,
            defaults={
                "is_active": is_active,
                "start_date": start_date,
                "end_date": end_date,
            },
        )

        return coach, coach_created, assignment_created

    def update_default_coach_fields(self, coach_ids: set[int]) -> None:
        for coach in Coach.objects.filter(coach_id__in=coach_ids):
            latest_assignment = (
                coach.season_assignments.select_related(
                    "team_season",
                    "team_season__team",
                    "team_season__season",
                )
                .filter(is_active=True)
                .order_by(
                    "-team_season__season__year",
                    "role",
                    "team_season__team__team_name",
                )
                .first()
            )

            if latest_assignment is None:
                latest_assignment = (
                    coach.season_assignments.select_related(
                        "team_season",
                        "team_season__team",
                        "team_season__season",
                    )
                    .order_by(
                        "-team_season__season__year",
                        "role",
                        "team_season__team__team_name",
                    )
                    .first()
                )

            if latest_assignment is None:
                continue

            coach.role = latest_assignment.role
            coach.team = latest_assignment.team_season.team
            coach.save(update_fields=["role", "team"])

    def normalize_role(self, value: str) -> str:
        cleaned = " ".join(value.strip().split())
        return ROLE_ALIASES.get(cleaned.lower(), cleaned)

    def parse_year(self, value: str | None, row_number: int) -> int:
        raw_value = self.required_value(value, "year", row_number)

        try:
            return int(raw_value)
        except ValueError as error:
            raise CommandError(
                f"Row {row_number}: year must be an integer."
            ) from error

    def parse_bool(self, value: str | None, default: bool) -> bool:
        if value is None or str(value).strip() == "":
            return default

        normalized = str(value).strip().lower()

        if normalized in {"true", "1", "yes", "y", "active"}:
            return True

        if normalized in {"false", "0", "no", "n", "inactive"}:
            return False

        return default

    def parse_optional_date(
        self,
        value: str | None,
        row_number: int,
    ) -> date | None:
        if value is None or str(value).strip() == "":
            return None

        raw_value = str(value).strip()

        try:
            return date.fromisoformat(raw_value)
        except ValueError as error:
            raise CommandError(
                f"Row {row_number}: invalid date '{raw_value}'. "
                "Use YYYY-MM-DD format."
            ) from error

    def required_value(
        self,
        value: str | None,
        field_name: str,
        row_number: int,
    ) -> str:
        if value is None or str(value).strip() == "":
            raise CommandError(f"Row {row_number}: '{field_name}' is required.")

        return str(value).strip()

    def print_summary(self, summary: ImportSummary, dry_run: bool) -> None:
        self.stdout.write("")
        self.stdout.write("Coach assignment import summary")
        self.stdout.write("-" * 56)
        self.stdout.write(f"rows_read: {summary.rows_read}")
        self.stdout.write(f"rows_imported: {summary.rows_imported}")
        self.stdout.write(f"rows_skipped: {summary.rows_skipped}")
        self.stdout.write(f"coaches_created: {summary.coaches_created}")
        self.stdout.write(f"coaches_updated: {summary.coaches_updated}")
        self.stdout.write(f"assignments_created: {summary.assignments_created}")
        self.stdout.write(f"assignments_updated: {summary.assignments_updated}")
        self.stdout.write(f"dry_run: {dry_run}")

        if dry_run:
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING(
                    "Dry run complete. No database changes were committed."
                )
            )
        else:
            self.stdout.write("")
            self.stdout.write(
                self.style.SUCCESS("Coach assignment import complete.")
            )