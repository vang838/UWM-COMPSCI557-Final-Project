# backend/apps/stats/stat_scope.py

CORE_STAT_KEYS = frozenset(
    [
        "passing_yards",
        "passing_touchdowns",
        "interceptions_thrown",
        "rushing_yards",
        "rushing_touchdowns",
        "receptions",
        "receiving_yards",
        "receiving_touchdowns",
        "forced_fumbles",
        "interceptions",
        "sacks",
        "tackles",
        "field_goals_made",
        "extra_points_made",
    ]
)

VALID_STAT_SCOPES = {"core", "advanced", "all"}
VALID_INCLUDE_STATS = {"none", "core", "advanced", "all"}


def normalize_stat_scope(value, default="core"):
    normalized = str(value or default).strip().lower()

    if normalized not in VALID_STAT_SCOPES:
        return default

    return normalized


def normalize_include_stats(value, default="core"):
    normalized = str(value or default).strip().lower()

    if normalized in {"false", "no", "0", "none"}:
        return "none"

    if normalized in {"true", "yes", "1"}:
        return default

    if normalized not in VALID_INCLUDE_STATS:
        return default

    return normalized


def is_core_stat_key(key):
    return bool(key) and key in CORE_STAT_KEYS


def is_advanced_stat_key(key):
    return bool(key) and str(key).startswith("nflverse_")


def matches_stat_scope(key, stat_scope):
    scope = normalize_stat_scope(stat_scope)

    if scope == "core":
        return is_core_stat_key(key)

    if scope == "advanced":
        return is_advanced_stat_key(key)

    return True


def apply_stat_scope_filter(queryset, stat_scope, key_lookup="key"):
    scope = normalize_stat_scope(stat_scope)

    if scope == "core":
        return queryset.filter(**{f"{key_lookup}__in": CORE_STAT_KEYS})

    if scope == "advanced":
        return queryset.filter(**{f"{key_lookup}__startswith": "nflverse_"})

    return queryset