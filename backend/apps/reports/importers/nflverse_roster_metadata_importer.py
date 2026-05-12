from __future__ import annotations
from django.utils.dateparse import parse_date

import csv
import re
import unicodedata
from decimal import Decimal, InvalidOperation
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

from apps.players.models import Player
from apps.seasons.models import PlayerSeasonRoster, Season, TeamSeason
from apps.teams.models import Team


DB_TO_NFLVERSE_TEAM = {
    "LAR": "LA",
}

NFLVERSE_TO_DB_TEAM = {
    "LA": "LAR",
}


@dataclass
class RosterMetadataImportSummary:
    rows_read: int = 0
    rows_matched_team_year: int = 0
    rows_skipped_team_year: int = 0
    rows_skipped_duplicate_source: int = 0
    rows_missing_headshot: int = 0
    players_matched: int = 0
    players_updated: int = 0
    players_unchanged: int = 0
    missing_matches: int = 0
    ambiguous_matches: int = 0
    dry_run: bool = False
    team: str = ""
    source_team: str = ""
    year: int = 0
    file: str = ""
    missing_match_samples: list[str] = field(default_factory=list)
    ambiguous_match_samples: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "rows_read": self.rows_read,
            "rows_matched_team_year": self.rows_matched_team_year,
            "rows_skipped_team_year": self.rows_skipped_team_year,
            "rows_skipped_duplicate_source": self.rows_skipped_duplicate_source,
            "rows_missing_headshot": self.rows_missing_headshot,
            "players_matched": self.players_matched,
            "players_updated": self.players_updated,
            "players_unchanged": self.players_unchanged,
            "missing_matches": self.missing_matches,
            "ambiguous_matches": self.ambiguous_matches,
            "dry_run": self.dry_run,
            "team": self.team,
            "source_team": self.source_team,
            "year": self.year,
            "file": self.file,
            "missing_match_samples": self.missing_match_samples,
            "ambiguous_match_samples": self.ambiguous_match_samples,
        }


def normalize_text(value: str | None) -> str:
    if not value:
        return ""

    normalized = unicodedata.normalize("NFKD", value)
    normalized = normalized.encode("ascii", "ignore").decode("ascii")
    normalized = normalized.lower()
    normalized = normalized.replace("'", "")
    normalized = normalized.replace(".", "")
    normalized = normalized.replace("-", " ")
    normalized = re.sub(r"[^a-z0-9\s]", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()

    return normalized


def remove_suffixes(value: str) -> str:
    suffixes = {"jr", "sr", "ii", "iii", "iv", "v"}
    parts = value.split()

    while parts and parts[-1] in suffixes:
        parts.pop()

    return " ".join(parts)


def normalize_player_name(first_name: str | None, last_name: str | None) -> str:
    full_name = f"{first_name or ''} {last_name or ''}".strip()
    return remove_suffixes(normalize_text(full_name))


def normalize_full_name(full_name: str | None) -> str:
    return remove_suffixes(normalize_text(full_name))


def get_db_team_abbreviation(team_abbreviation: str) -> str:
    normalized = team_abbreviation.strip().upper()
    return NFLVERSE_TO_DB_TEAM.get(normalized, normalized)


def get_nflverse_team_abbreviation(team_abbreviation: str) -> str:
    normalized = team_abbreviation.strip().upper()
    return DB_TO_NFLVERSE_TEAM.get(normalized, normalized)


def build_roster_lookup(rosters: Iterable[PlayerSeasonRoster]) -> dict[str, list[PlayerSeasonRoster]]:
    lookup: dict[str, list[PlayerSeasonRoster]] = {}

    for roster in rosters:
        player = roster.player

        keys = {
            normalize_player_name(player.first_name, player.last_name),
            normalize_full_name(f"{player.first_name} {player.last_name}"),
            normalize_full_name(str(player)),
        }

        for key in keys:
            if not key:
                continue

            lookup.setdefault(key, []).append(roster)

    return lookup

def first_non_empty(row: dict, *column_names: str) -> str:
    for column_name in column_names:
        value = str(row.get(column_name) or "").strip()

        if value:
            return value

    return ""


def parse_optional_date(value: str | None):
    cleaned_value = str(value or "").strip()

    if not cleaned_value:
        return None

    return parse_date(cleaned_value)


def parse_optional_decimal(value: str | None):
    cleaned_value = str(value or "").strip()

    if not cleaned_value:
        return None

    try:
        parsed_value = Decimal(cleaned_value)

        if not parsed_value.is_finite():
            return None

        return parsed_value
    except InvalidOperation:
        return None


def get_row_candidate_keys(row: dict) -> list[str]:
    keys = [
        normalize_player_name(row.get("first_name"), row.get("last_name")),
        normalize_full_name(row.get("full_name")),
    ]

    football_name = row.get("football_name")
    last_name = row.get("last_name")

    if football_name and last_name:
        keys.append(normalize_player_name(football_name, last_name))

    seen = set()
    unique_keys = []

    for key in keys:
        if key and key not in seen:
            unique_keys.append(key)
            seen.add(key)

    return unique_keys


def find_matching_roster(
    row: dict,
    roster_lookup: dict[str, list[PlayerSeasonRoster]],
) -> tuple[PlayerSeasonRoster | None, bool]:
    """
    Returns:
        (matched_roster, ambiguous)
    """
    candidate_keys = get_row_candidate_keys(row)

    matches: list[PlayerSeasonRoster] = []

    for key in candidate_keys:
        matches.extend(roster_lookup.get(key, []))

    unique_by_player_id = {
        roster.player.player_id: roster
        for roster in matches
    }

    if len(unique_by_player_id) == 1:
        return next(iter(unique_by_player_id.values())), False

    if len(unique_by_player_id) > 1:
        return None, True

    return None, False


def import_nflverse_roster_metadata(
    file_path: str | Path,
    team: str,
    year: int,
    source_team: str | None = None,
    dry_run: bool = False,
) -> RosterMetadataImportSummary:
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"Roster file not found: {path}")

    db_team_abbreviation = get_db_team_abbreviation(team)
    nflverse_team_abbreviation = (
        source_team.strip().upper()
        if source_team
        else get_nflverse_team_abbreviation(db_team_abbreviation)
    )

    db_team = Team.objects.get(abbreviation=db_team_abbreviation)
    season = Season.objects.get(year=year)
    team_season = TeamSeason.objects.get(team=db_team, season=season)

    rosters = (
        PlayerSeasonRoster.objects
        .select_related(
            "player",
            "team_season",
            "team_season__team",
            "team_season__season",
        )
        .filter(team_season=team_season)
    )

    roster_lookup = build_roster_lookup(rosters)

    summary = RosterMetadataImportSummary(
        dry_run=dry_run,
        team=db_team_abbreviation,
        source_team=nflverse_team_abbreviation,
        year=year,
        file=str(path.resolve()),
    )

    processed_source_keys: set[str] = set()
    processed_player_ids: set[int] = set()

    with path.open(newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        for row in reader:
            summary.rows_read += 1

            row_season = str(row.get("season", "")).strip()
            row_team = str(row.get("team", "")).strip().upper()

            if row_season != str(year) or row_team != nflverse_team_abbreviation:
                summary.rows_skipped_team_year += 1
                continue

            summary.rows_matched_team_year += 1

            source_key = "|".join(
                [
                    str(row.get("gsis_id") or "").strip(),
                    normalize_full_name(row.get("full_name")),
                    str(row.get("team") or "").strip().upper(),
                    str(row.get("season") or "").strip(),
                ]
            )

            if source_key in processed_source_keys:
                summary.rows_skipped_duplicate_source += 1
                continue

            processed_source_keys.add(source_key)

            headshot_url = first_non_empty(row, "headshot_url", "player_headshot_url")
            date_of_birth = parse_optional_date(
                first_non_empty(row, "birth_date", "date_of_birth", "dob")
            )
            college = first_non_empty(row, "college", "college_name", "school")
            height = parse_optional_decimal(
                first_non_empty(row, "height", "height_inches")
            )
            weight = parse_optional_decimal(
                first_non_empty(row, "weight", "weight_lbs")
            )

            if not headshot_url:
                summary.rows_missing_headshot += 1

            matched_roster, ambiguous = find_matching_roster(row, roster_lookup)

            sample_name = (
                row.get("full_name")
                or f"{row.get('first_name', '')} {row.get('last_name', '')}".strip()
                or "Unknown player"
            )

            if ambiguous:
                summary.ambiguous_matches += 1

                if len(summary.ambiguous_match_samples) < 20:
                    summary.ambiguous_match_samples.append(sample_name)

                continue

            if matched_roster is None:
                summary.missing_matches += 1

                if len(summary.missing_match_samples) < 20:
                    summary.missing_match_samples.append(sample_name)

                continue

            player: Player = matched_roster.player

            if player.player_id in processed_player_ids:
                summary.rows_skipped_duplicate_source += 1
                continue

            processed_player_ids.add(player.player_id)
            summary.players_matched += 1

            update_fields = []

            if headshot_url and player.headshot_url != headshot_url:
                player.headshot_url = headshot_url
                update_fields.append("headshot_url")

            if date_of_birth and player.date_of_birth != date_of_birth:
                player.date_of_birth = date_of_birth
                update_fields.append("date_of_birth")

            if college and player.college != college:
                player.college = college
                update_fields.append("college")

            if height is not None and player.height != height:
                player.height = height
                update_fields.append("height")

            if weight is not None and player.weight != weight:
                player.weight = weight
                update_fields.append("weight")

            if not update_fields:
                summary.players_unchanged += 1
                continue

            summary.players_updated += 1

            if not dry_run:
                player.save(update_fields=update_fields)

    return summary