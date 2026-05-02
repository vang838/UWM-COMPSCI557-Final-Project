# backend/apps/reports/importers/nflverse_player_stats_importer.py

from __future__ import annotations

import csv
from dataclasses import dataclass, asdict
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

from django.db import transaction

from apps.players.models import Player
from apps.seasons.models import Season, TeamSeason, PlayerSeasonRoster
from apps.stats.models import StatType, PositionStatType, PlayerSeasonStat
from apps.teams.models import Team


@dataclass
class ImportSummary:
    rows_read: int = 0
    rows_matched: int = 0
    rows_skipped: int = 0

    players_created: int = 0
    players_updated: int = 0

    team_seasons_created: int = 0
    rosters_created: int = 0

    stat_types_created: int = 0
    position_mappings_created: int = 0

    stats_created: int = 0
    stats_updated: int = 0
    stats_skipped_zero: int = 0

    errors: int = 0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

NFLVERSE_TEAM_ALIASES = {
    "LAR": "LA",
}

NFLVERSE_STAT_MAP = {
    "passing_yards": {
        "key": "passing_yards",
        "name": "Passing Yards",
        "category": "passing",
        "unit": "yards",
        "description": "Total yards gained through passing.",
        "display_order": 10,
    },
    "passing_tds": {
        "key": "passing_touchdowns",
        "name": "Passing Touchdowns",
        "category": "passing",
        "unit": "count",
        "description": "Total passing touchdowns.",
        "display_order": 20,
    },
    "passing_interceptions": {
        "key": "interceptions_thrown",
        "name": "Interceptions Thrown",
        "category": "passing",
        "unit": "count",
        "description": "Passes intercepted by the defense.",
        "display_order": 30,
    },
    "rushing_yards": {
        "key": "rushing_yards",
        "name": "Rushing Yards",
        "category": "rushing",
        "unit": "yards",
        "description": "Total yards gained by rushing.",
        "display_order": 10,
    },
    "rushing_tds": {
        "key": "rushing_touchdowns",
        "name": "Rushing Touchdowns",
        "category": "rushing",
        "unit": "count",
        "description": "Total rushing touchdowns.",
        "display_order": 20,
    },
    "receptions": {
        "key": "receptions",
        "name": "Receptions",
        "category": "receiving",
        "unit": "count",
        "description": "Total completed catches.",
        "display_order": 10,
    },
    "receiving_yards": {
        "key": "receiving_yards",
        "name": "Receiving Yards",
        "category": "receiving",
        "unit": "yards",
        "description": "Total receiving yards.",
        "display_order": 20,
    },
    "receiving_tds": {
        "key": "receiving_touchdowns",
        "name": "Receiving Touchdowns",
        "category": "receiving",
        "unit": "count",
        "description": "Total receiving touchdowns.",
        "display_order": 30,
    },
    "def_fumbles_forced": {
        "key": "forced_fumbles",
        "name": "Forced Fumbles",
        "category": "defense",
        "unit": "count",
        "description": "Fumbles caused by the player.",
        "display_order": 10,
    },
    "def_interceptions": {
        "key": "interceptions",
        "name": "Interceptions",
        "category": "defense",
        "unit": "count",
        "description": "Passes intercepted by the player.",
        "display_order": 20,
    },
    "def_sacks": {
        "key": "sacks",
        "name": "Sacks",
        "category": "defense",
        "unit": "count",
        "description": "Total quarterback sacks.",
        "display_order": 30,
    },
    "def_tackles_with_assist": {
        "key": "tackles",
        "name": "Tackles",
        "category": "defense",
        "unit": "count",
        "description": "Total tackles, including assisted tackles.",
        "display_order": 40,
    },
    "fg_made": {
        "key": "field_goals_made",
        "name": "Field Goals Made",
        "category": "kicking",
        "unit": "count",
        "description": "Successful field goals.",
        "display_order": 10,
    },
    "pat_made": {
        "key": "extra_points_made",
        "name": "Extra Points Made",
        "category": "kicking",
        "unit": "count",
        "description": "Successful extra point attempts.",
        "display_order": 20,
    },
}


class NflverseImportError(Exception):
    pass


def parse_decimal(value: str | None) -> Decimal:
    if value is None or value == "":
        return Decimal("0")

    try:
        return Decimal(str(value))
    except InvalidOperation:
        return Decimal("0")


def split_player_name(full_name: str) -> tuple[str, str]:
    cleaned_name = " ".join((full_name or "").strip().split())

    if not cleaned_name:
        return "Unknown", "Player"

    parts = cleaned_name.split(" ", 1)

    if len(parts) == 1:
        return parts[0], ""

    return parts[0], parts[1]


def get_required_team(team_abbreviation: str) -> Team:
    try:
        return Team.objects.get(abbreviation__iexact=team_abbreviation)
    except Team.DoesNotExist as error:
        raise NflverseImportError(
            f"Team with abbreviation '{team_abbreviation}' does not exist. "
            f"Create the team first or import teams before importing player stats."
        ) from error


def get_or_create_stat_type(nflverse_column: str, summary: ImportSummary) -> StatType:
    config = NFLVERSE_STAT_MAP[nflverse_column]

    stat_type, created = StatType.objects.get_or_create(
        key=config["key"],
        defaults={
            "name": config["name"],
            "category": config["category"],
            "unit": config["unit"],
            "description": config["description"],
        },
    )

    if created:
        summary.stat_types_created += 1

    return stat_type


def ensure_position_mapping(
    position: str,
    stat_type: StatType,
    display_order: int,
    summary: ImportSummary,
) -> None:
    if not position:
        return

    _, created = PositionStatType.objects.get_or_create(
        position=position,
        stat_type=stat_type,
        defaults={
            "display_order": display_order,
            "is_primary": True,
        },
    )

    if created:
        summary.position_mappings_created += 1


def import_nflverse_player_stats(
    file_path: str | Path,
    team_abbreviation: str,
    year: int,
    season_type: str = "REG",
    skip_zero_values: bool = True,
    dry_run: bool = False,
) -> dict[str, Any]:
    path = Path(file_path)

    if not path.exists():
        raise NflverseImportError(f"CSV file not found: {path}")

    summary = ImportSummary()
    team = get_required_team(team_abbreviation)
    team_abbreviation = team_abbreviation.upper()

    source_team_abbreviation = NFLVERSE_TEAM_ALIASES.get(
        team_abbreviation,
        team_abbreviation,
    )

    with transaction.atomic():
        season, _ = Season.objects.get_or_create(year=year)

        team_season, team_season_created = TeamSeason.objects.get_or_create(
            team=team,
            season=season,
            defaults={
                "conference": team.conference,
                "division": team.division,
            },
        )

        if team_season_created:
            summary.team_seasons_created += 1

        with path.open(newline="", encoding="utf-8") as csv_file:
            reader = csv.DictReader(csv_file)

            for row in reader:
                summary.rows_read += 1

                row_team = (row.get("recent_team") or "").strip()
                row_year = row.get("season")
                row_season_type = (row.get("season_type") or "").strip()

                if row_team != source_team_abbreviation:
                    summary.rows_skipped += 1
                    continue

                if str(row_year) != str(year):
                    summary.rows_skipped += 1
                    continue

                if row_season_type != season_type:
                    summary.rows_skipped += 1
                    continue

                summary.rows_matched += 1

                try:
                    player_display_name = row.get("player_display_name") or row.get("player_name") or ""
                    first_name, last_name = split_player_name(player_display_name)
                    position = (row.get("position") or "").strip() or "UNK"

                    player, player_created = Player.objects.get_or_create(
                        first_name=first_name,
                        last_name=last_name,
                        team=team,
                        defaults={
                            "position": position,
                            "is_active": True,
                        },
                    )

                    if player_created:
                        summary.players_created += 1
                    else:
                        changed = False

                        if player.position != position:
                            player.position = position
                            changed = True

                        if player.team_id != team.team_id:
                            player.team = team
                            changed = True

                        if player.is_active is False:
                            player.is_active = True
                            changed = True

                        if changed:
                            player.save(update_fields=["position", "team", "is_active"])
                            summary.players_updated += 1

                    roster, roster_created = PlayerSeasonRoster.objects.get_or_create(
                        player=player,
                        team_season=team_season,
                        defaults={
                            "jersey_number": None,
                            "roster_status": "Active",
                            "is_active": True,
                        },
                    )

                    if roster_created:
                        summary.rosters_created += 1

                    for nflverse_column, config in NFLVERSE_STAT_MAP.items():
                        value = parse_decimal(row.get(nflverse_column))

                        if skip_zero_values and value == Decimal("0"):
                            summary.stats_skipped_zero += 1
                            continue

                        stat_type = get_or_create_stat_type(nflverse_column, summary)
                        ensure_position_mapping(
                            position=position,
                            stat_type=stat_type,
                            display_order=int(config["display_order"]),
                            summary=summary,
                        )

                        player_stat, stat_created = PlayerSeasonStat.objects.get_or_create(
                            player_roster=roster,
                            stat_type=stat_type,
                            defaults={
                                "value": value,
                            },
                        )

                        if stat_created:
                            summary.stats_created += 1
                        elif player_stat.value != value:
                            player_stat.value = value
                            player_stat.save(update_fields=["value"])
                            summary.stats_updated += 1

                except Exception:
                    summary.errors += 1
                    raise

        if dry_run:
            transaction.set_rollback(True)

    result = summary.to_dict()
    result["dry_run"] = dry_run
    result["team"] = team_abbreviation
    result["source_team"] = source_team_abbreviation
    result["year"] = year
    result["season_type"] = season_type
    result["file"] = str(path)

    return result