# backend/apps/reports/services.py

from decimal import Decimal
from functools import lru_cache
from pathlib import Path

from django.db import connection

from apps.players.models import Player
from apps.seasons.models import TeamSeason


BASE_DIR = Path(__file__).resolve().parent
SQL_DIR = BASE_DIR / "sql"


@lru_cache(maxsize=32)
def load_sql(filename: str) -> str:
    sql_path = SQL_DIR / filename

    if not sql_path.exists():
        raise FileNotFoundError(f"SQL file not found: {sql_path}")

    return sql_path.read_text(encoding="utf-8")


def normalize_decimal(value):
    if value is None:
        return 0

    if isinstance(value, Decimal):
        return float(value)

    return value


def build_player_summary(player: Player) -> dict:
    return {
        "player_id": player.player_id,
        "first_name": player.first_name,
        "last_name": player.last_name,
        "full_name": f"{player.first_name} {player.last_name}".strip(),
        "position": player.position,
        "headshot_url": player.headshot_url or "",
    }


def get_player_summaries(player_ids: list[int]) -> dict[int, dict]:
    players = (
        Player.objects
        .only(
            "player_id",
            "first_name",
            "last_name",
            "position",
            "headshot_url",
        )
        .filter(player_id__in=player_ids)
    )

    return {
        player.player_id: build_player_summary(player)
        for player in players
    }


def get_team_season_id(team_id: int, year: int) -> int:
    return (
        TeamSeason.objects
        .only("team_season_id")
        .get(team_id=team_id, season__year=year)
        .team_season_id
    )


def get_player_comparison_report(
    *,
    left_player_id: int,
    right_player_id: int,
    team_id: int,
    year: int,
) -> dict:
    sql = load_sql("player_comparison.sql")

    team_season_id = get_team_season_id(team_id=team_id, year=year)

    params = [
        left_player_id,
        right_player_id,
        team_season_id,
        left_player_id,
        right_player_id,
    ]

    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        columns = [column[0] for column in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

    player_summaries = get_player_summaries([left_player_id, right_player_id])

    comparison_rows = []

    for row in rows:
        left_value = normalize_decimal(row.get("left_value"))
        right_value = normalize_decimal(row.get("right_value"))

        left_number = float(left_value or 0)
        right_number = float(right_value or 0)
        max_value = max(left_number, right_number, 1)

        comparison_rows.append(
            {
                "stat_key": row.get("stat_key"),
                "stat_name": row.get("stat_name"),
                "stat_category": row.get("stat_category"),
                "stat_unit": row.get("stat_unit"),
                "left_value": left_value,
                "right_value": right_value,
                "left_percent": round((left_number / max_value) * 100),
                "right_percent": round((right_number / max_value) * 100),
            }
        )

    return {
        "team_id": team_id,
        "year": year,
        "left_player": player_summaries.get(left_player_id),
        "right_player": player_summaries.get(right_player_id),
        "rows": comparison_rows,
    }