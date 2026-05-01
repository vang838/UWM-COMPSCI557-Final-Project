from pathlib import Path
from decimal import Decimal

from django.db import connection

from apps.players.models import Player


BASE_DIR = Path(__file__).resolve().parent
SQL_DIR = BASE_DIR / "sql"


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


def get_player_summary(player_id: int) -> dict:
    player = Player.objects.get(player_id=player_id)

    return {
        "player_id": player.player_id,
        "first_name": player.first_name,
        "last_name": player.last_name,
        "full_name": f"{player.first_name} {player.last_name}".strip(),
        "position": player.position,
    }


def get_player_comparison_report(
    *,
    left_player_id: int,
    right_player_id: int,
    team_id: int,
    year: int,
) -> dict:
    sql = load_sql("player_comparison.sql")

    params = [
        left_player_id,
        right_player_id,
        team_id,
        year,
        left_player_id,
        right_player_id,
    ]

    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        columns = [column[0] for column in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

    comparison_rows = []

    for row in rows:
        left_value = normalize_decimal(row.get("left_value"))
        right_value = normalize_decimal(row.get("right_value"))

        max_value = max(float(left_value or 0), float(right_value or 0), 1)

        comparison_rows.append(
            {
                "stat_key": row.get("stat_key"),
                "stat_name": row.get("stat_name"),
                "stat_category": row.get("stat_category"),
                "stat_unit": row.get("stat_unit"),
                "left_value": left_value,
                "right_value": right_value,
                "left_percent": round((float(left_value or 0) / max_value) * 100),
                "right_percent": round((float(right_value or 0) / max_value) * 100),
            }
        )

    return {
        "team_id": team_id,
        "year": year,
        "left_player": get_player_summary(left_player_id),
        "right_player": get_player_summary(right_player_id),
        "rows": comparison_rows,
    }