import {
    CoachSeasonAssignment,
    LeaderboardRow,
    Player,
    PlayerSeasonStat,
    TopPerformer,
} from "@/src/types/dashboard";

const COACH_ROLE_ORDER: Record<string, number> = {
    "Head Coach": 1,
    "Offensive Coordinator": 2,
    "Defensive Coordinator": 3,
    "Special Teams Coordinator": 4,
};

export function toNumber(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
}

export function noData(value: unknown): string | number {
    if (value === null || value === undefined || value === "") {
        return "No data";
    }

    return value as string | number;
}

export function displayPlayerName(player: Player): string {
    return (
        player.name ||
        `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim() ||
        "Unknown player"
    );
}

export function getStablePlayerId(player: Player): number | string | undefined {
    return player.player_id ?? player.id;
}

export function getPlayerId(player: Player, index?: number): number | string {
    return (
        player.id ??
        player.player_id ??
        `${displayPlayerName(player)}-${player.jersey_number ?? index ?? "unknown"}`
    );
}

export function formatStatNumber(value: number | undefined): string | number {
    if (value === undefined) {
        return "No data";
    }

    return Number.isInteger(value)
        ? value.toLocaleString()
        : value.toLocaleString(undefined, {
              maximumFractionDigits: 2,
          });
}

export function sumStats(
    stats: PlayerSeasonStat[],
    statKeys: string[]
): number | undefined {
    const matchingStats = stats.filter((stat) =>
        stat.stat_type_key ? statKeys.includes(stat.stat_type_key) : false
    );

    if (matchingStats.length === 0) {
        return undefined;
    }

    return matchingStats.reduce((total, stat) => total + toNumber(stat.value), 0);
}

export function getStatsForPlayer(
    player: Player,
    allStats: PlayerSeasonStat[]
): PlayerSeasonStat[] {
    const playerId = player.player_id ?? player.id;

    const matchedStats = allStats.filter((stat) => {
        if (playerId === undefined || stat.player_id === undefined) {
            return false;
        }

        return String(stat.player_id) === String(playerId);
    });

    if (matchedStats.length > 0) {
        return matchedStats;
    }

    return player.season_stats ?? [];
}

export function sortPlayerStats(stats: PlayerSeasonStat[]): PlayerSeasonStat[] {
    return [...stats].sort((a, b) => {
        const categoryCompare = String(a.stat_type_category ?? "").localeCompare(
            String(b.stat_type_category ?? "")
        );

        if (categoryCompare !== 0) {
            return categoryCompare;
        }

        return (a.display_order ?? 999) - (b.display_order ?? 999);
    });
}

export function buildLeaderboardRows(
    stats: PlayerSeasonStat[],
    statKey: string
): LeaderboardRow[] {
    if (!statKey) {
        return [];
    }

    return stats
        .filter((stat) => stat.stat_type_key === statKey)
        .sort((a, b) => toNumber(b.value) - toNumber(a.value))
        .map((stat) => ({
            id: stat.player_season_stat_id,
            player_id: stat.player_id,
            player_name: stat.player_name,
            position: stat.position,
            stat_type: stat.stat_type_name,
            stat_value: stat.value,
            value: stat.value,
        }));
}

export function getLeaderboardName(row: LeaderboardRow): string {
    return (
        row.player_name ||
        row.name ||
        `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() ||
        "Unknown player"
    );
}

export function getLeaderboardId(row: LeaderboardRow, index: number): number | string {
    return row.player_id ?? row.id ?? `${getLeaderboardName(row)}-${index}`;
}

export function getStatValue(row: LeaderboardRow): number {
    const rawValue = row.stat_value ?? row.value ?? row.total ?? 0;
    return toNumber(rawValue);
}

export function getTopPerformer(
    stats: PlayerSeasonStat[],
    statKey: string,
    label: string
): TopPerformer | null {
    const sorted = stats
        .filter((stat) => stat.stat_type_key === statKey)
        .sort((a, b) => toNumber(b.value) - toNumber(a.value));

    const top = sorted[0];

    if (!top) {
        return null;
    }

    return {
        label,
        playerName: top.player_name || "Unknown player",
        position: top.position,
        statName: top.stat_type_name || top.stat_type_key || statKey,
        value: toNumber(top.value),
        unit: top.stat_type_unit,
    };
}

export function sortCoachAssignments(
    assignments: CoachSeasonAssignment[]
): CoachSeasonAssignment[] {
    return [...assignments].sort((a, b) => {
        const roleA = COACH_ROLE_ORDER[a.role ?? ""] ?? 999;
        const roleB = COACH_ROLE_ORDER[b.role ?? ""] ?? 999;

        if (roleA !== roleB) {
            return roleA - roleB;
        }

        return String(a.coach_full_name ?? "").localeCompare(
            String(b.coach_full_name ?? "")
        );
    });
}

export function getSeasonYearFromLabel(label: string): string | undefined {
    return label.match(/\d{4}/)?.[0];
}

export const CORE_STAT_KEYS = new Set([
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
]);

export function isCoreStatKey(key?: string | null): boolean {
    return !!key && CORE_STAT_KEYS.has(key);
}

export function isAdvancedStatKey(key?: string | null): boolean {
    return !!key && key.startsWith("nflverse_");
}

export type StatScope = "core" | "advanced" | "all";

export function matchesStatScope(
    statKey: string | undefined | null,
    scope: StatScope
): boolean {
    if (scope === "core") {
        return isCoreStatKey(statKey);
    }

    if (scope === "advanced") {
        return isAdvancedStatKey(statKey);
    }

    return true;
}