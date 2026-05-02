'use client';

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { playerAPI } from "@/src/api/players";
import { seasonAPI } from "@/src/api/seasons";
import { teamAPI } from "@/src/api/teams";
import { statAPI } from "@/src/api/stats";
import { coachAPI } from "@/src/api/coaches";
import { reportAPI } from "@/src/api/reports";

import SeasonSummaryPanel from "@/src/components/dashboard/SeasonSummaryPanel";
import PlayerComparisonPanel from "@/src/components/dashboard/PlayerComparisonPanel";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import PageLayout, { NavSection, LayoutTheme, TeamOption } from "@/src/components/pageLayout";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlayerSeasonStat {
    player_season_stat_id?: number;
    player_roster?: number;
    player_id?: number;
    player_name?: string;
    position?: string;
    team_id?: number;
    team_name?: string;
    team_abbreviation?: string;
    season_id?: number;
    season_year?: number | string;
    stat_type?: number;
    stat_type_key?: string;
    stat_type_name?: string;
    stat_type_category?: string;
    stat_type_unit?: string;
    value?: number | string;
    is_primary?: boolean;
    display_order?: number;
}

interface Player {
    id?: number;
    player_id?: number;
    first_name?: string;
    last_name?: string;
    name?: string;
    position?: string;
    jersey_number?: number | string;
    team?: number | string;
    team_name?: string;
    is_active?: boolean;
    season_stats?: PlayerSeasonStat[];
}

interface Season {
    id?: number;
    season_id?: number;
    year?: number | string;
}

interface Team {
    id?: number;
    team_id?: number;
    city?: string;
    state?: string;
    team_name?: string;
    display_name?: string;
    conference?: string;
    division?: string;
    abbreviation?: string;
    primary_color?: string;
    secondary_color?: string;
    text_color?: string;
}

interface StatType {
    stat_type_id?: number;
    key?: string;
    name?: string;
    category?: string;
    unit?: string;
    description?: string;
}

interface CoachSeasonAssignment {
    assignment_id?: number;
    coach?: number;
    coach_first_name?: string;
    coach_last_name?: string;
    coach_full_name?: string;
    team_season?: number;
    team_id?: number;
    team_name?: string;
    team_abbreviation?: string;
    season_id?: number;
    season_year?: number | string;
    conference?: string;
    division?: string;
    role?: string;
    is_active?: boolean;
    start_date?: string | null;
    end_date?: string | null;
}

interface LeaderboardRow {
    player_id?: number;
    id?: number;
    player_name?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    position?: string;
    stat_type?: string;
    stat_value?: number | string;
    value?: number | string;
    total?: number | string;
}

interface PlayerComparisonReportPlayer {
    player_id: number;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    position?: string;
}

interface PlayerComparisonReportRow {
    stat_key: string;
    stat_name: string;
    stat_category: string;
    stat_unit?: string;
    left_value: number;
    right_value: number;
    left_percent: number;
    right_percent: number;
}

interface PlayerComparisonReport {
    team_id: number;
    year: number;
    left_player: PlayerComparisonReportPlayer;
    right_player: PlayerComparisonReportPlayer;
    rows: PlayerComparisonReportRow[];
}

interface TopPerformer {
    label: string;
    playerName: string;
    position?: string;
    statName: string;
    value: number;
    unit?: string;
}

// ---------------------------------------------------------------------------
// Nav config
// ---------------------------------------------------------------------------

const USER_NAV: NavSection[] = [
    {
        heading: "Overview",
        items: [
            { label: "Dashboard", section: "dashboard" },
            { label: "Season summary", section: "season-summary" },
        ],
    },
    {
        heading: "Roster",
        items: [
            { label: "Players", section: "players" },
            { label: "Coaches", section: "coaches" },
            { label: "Team roster", section: "team-roster" },
        ],
    },
    {
        heading: "Stats",
        items: [
            { label: "Player stats", section: "player-stats" },
            { label: "Stat types", section: "stat-types" },
            { label: "Leaderboard", section: "leaderboard" },
            { label: "Comparison", section: "comparison" },
        ],
    },
];

const AVATAR_COLORS = [
    "bg-[#c49a22]/20 text-[#f0c040]",
    "bg-emerald-900/40 text-emerald-400",
    "bg-blue-900/40 text-blue-400",
    "bg-rose-900/40 text-rose-400",
    "bg-violet-900/40 text-violet-400",
];

const COACH_ROLE_ORDER: Record<string, number> = {
    "Head Coach": 1,
    "Offensive Coordinator": 2,
    "Defensive Coordinator": 3,
    "Special Teams Coordinator": 4,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function unwrapApiData<T>(response: unknown): T {
    const maybeResponse = response as { data?: T };
    return maybeResponse?.data ?? (response as T);
}

function normalizeApiList<T>(response: unknown): T[] {
    const data = unwrapApiData<any>(response);

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.results)) {
        return data.results;
    }

    return [];
}

async function safeApiCall<T>(
    request: () => Promise<unknown>,
    fallback: T
): Promise<T> {
    try {
        const response = await request();
        return unwrapApiData<T>(response);
    } catch {
        return fallback;
    }
}

function displayName(player: Player): string {
    return (
        player.name ||
        `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim() ||
        "Unknown player"
    );
}

function getPlayerId(player: Player, index?: number): number | string {
    return (
        player.id ??
        player.player_id ??
        `${displayName(player)}-${player.jersey_number ?? index ?? "unknown"}`
    );
}

function getLeaderboardName(row: LeaderboardRow): string {
    return (
        row.player_name ||
        row.name ||
        `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() ||
        "Unknown player"
    );
}

function getLeaderboardId(row: LeaderboardRow, index: number): number | string {
    return row.player_id ?? row.id ?? `${getLeaderboardName(row)}-${index}`;
}

function toNumber(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
}

function getStatValue(row: LeaderboardRow): number {
    const rawValue = row.stat_value ?? row.value ?? row.total ?? 0;
    return toNumber(rawValue);
}

function getSeasonYearFromLabel(label: string): string | undefined {
    return label.match(/\d{4}/)?.[0];
}

function noData(value: unknown): string | number {
    if (value === null || value === undefined || value === "") {
        return "No data";
    }

    return value as string | number;
}

function formatStatNumber(value: number | undefined): string | number {
    if (value === undefined) {
        return "No data";
    }

    return Number.isInteger(value)
        ? value.toLocaleString()
        : value.toLocaleString(undefined, {
              maximumFractionDigits: 2,
          });
}

function sumStats(
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

function buildLeaderboardRows(
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

function getTopPerformer(
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

function getStatsForPlayer(
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

function sortPlayerStats(stats: PlayerSeasonStat[]): PlayerSeasonStat[] {
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

function groupStatsByCategory(
    stats: PlayerSeasonStat[]
): Record<string, PlayerSeasonStat[]> {
    return stats.reduce<Record<string, PlayerSeasonStat[]>>((groups, stat) => {
        const category = stat.stat_type_category || "other";

        if (!groups[category]) {
            groups[category] = [];
        }

        groups[category].push(stat);
        return groups;
    }, {});
}

function formatCategoryLabel(category: string): string {
    return category
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function sortCoachAssignments(assignments: CoachSeasonAssignment[]) {
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

function getSectionTitle(section: string): string {
    const titles: Record<string, string> = {
        dashboard: "Dashboard",
        "season-summary": "Season Summary",
        players: "Players",
        coaches: "Coaches",
        "team-roster": "Team Roster",
        "player-stats": "Player Stats",
        "stat-types": "Stat Types",
        leaderboard: "Leaderboard",
        comparison: "Player Comparison",
    };

    return titles[section] ?? "Dashboard";
}

function buildTeamTheme(team?: Team): Partial<LayoutTheme> {
    const primary = team?.primary_color || "#1a3d28";
    const secondary = team?.secondary_color || "#f0c040";
    const text = team?.text_color || "#ffffff";

    const darkText = text.toLowerCase() !== "#ffffff";

    return {
        sidebarBg: primary,
        sidebarText: text,
        sidebarMutedText: darkText
            ? "rgba(17, 24, 39, 0.65)"
            : "rgba(255, 255, 255, 0.45)",
        sidebarHoverBg: darkText
            ? "rgba(17, 24, 39, 0.08)"
            : "rgba(255, 255, 255, 0.05)",
        accent: secondary,
        activeBg: darkText
            ? "rgba(17, 24, 39, 0.10)"
            : "rgba(255, 255, 255, 0.12)",
        activeText: secondary,
        dotInactive: darkText
            ? "rgba(17, 24, 39, 0.35)"
            : "rgba(255, 255, 255, 0.25)",
        roleBadgeBg: darkText
            ? "rgba(17, 24, 39, 0.10)"
            : "rgba(255, 255, 255, 0.12)",
        roleBadgeText: secondary,
    };
}

// ---------------------------------------------------------------------------
// Small components
// ---------------------------------------------------------------------------

function EmptySection({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg p-6 min-h-[220px] flex flex-col items-center justify-center text-center">
            <p className="text-[14px] font-medium text-white mb-1">{title}</p>
            <p className="text-[12px] text-gray-500 max-w-md">{description}</p>
        </div>
    );
}

function StatCard({
    label,
    value,
    delta,
    positive,
}: {
    label: string;
    value: string | number;
    delta?: string;
    positive?: boolean;
}) {
    return (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                {label}
            </p>
            <p className="text-[22px] font-medium text-white leading-none">
                {value}
            </p>
            {delta && (
                <p
                    className={`text-[10px] mt-1 ${
                        positive ? "text-emerald-400" : "text-red-400"
                    }`}
                >
                    {delta}
                </p>
            )}
        </div>
    );
}

function PlayerInitials({ name }: { name: string }) {
    const parts = name.trim().split(" ").filter(Boolean);

    const initials =
        parts.length >= 2
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`
            : name.slice(0, 2);

    return <>{initials.toUpperCase()}</>;
}

function CompactSeasonSummaryCard({
    players,
    stats,
    coaches,
    teamLabel,
    selectedSeasonYear,
    onViewFullSummary,
}: {
    players: Player[];
    stats: PlayerSeasonStat[];
    coaches: CoachSeasonAssignment[];
    teamLabel: string;
    selectedSeasonYear: string;
    onViewFullSummary: () => void;
}) {
    const passingYards = sumStats(stats, ["passing_yards"]);
    const rushingYards = sumStats(stats, ["rushing_yards"]);
    const receivingYards = sumStats(stats, ["receiving_yards"]);
    const totalTouchdowns = sumStats(stats, [
        "passing_touchdowns",
        "rushing_touchdowns",
        "receiving_touchdowns",
    ]);

    const topPerformers = [
        getTopPerformer(stats, "passing_yards", "Top passer"),
        getTopPerformer(stats, "rushing_yards", "Top rusher"),
        getTopPerformer(stats, "receiving_yards", "Top receiver"),
        getTopPerformer(stats, "tackles", "Top tackler"),
    ].filter((performer): performer is TopPerformer => Boolean(performer));

    return (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
                <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                    Compact season summary
                </span>

                <button
                    onClick={onViewFullSummary}
                    className="text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                >
                    Full summary →
                </button>
            </div>

            <div className="px-3 py-3">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-[13px] font-medium text-white">
                            {teamLabel}
                        </p>
                        <p className="text-[11px] text-gray-500">
                            {selectedSeasonYear || "Selected season"} overview
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-[20px] font-semibold text-white leading-none">
                            {players.length}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                            roster
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="bg-[#111] border border-white/8 rounded-lg px-2 py-2">
                        <p className="text-[9px] uppercase tracking-widest text-gray-500">
                            Pass
                        </p>
                        <p className="text-[15px] font-semibold text-white">
                            {formatStatNumber(passingYards)}
                        </p>
                    </div>

                    <div className="bg-[#111] border border-white/8 rounded-lg px-2 py-2">
                        <p className="text-[9px] uppercase tracking-widest text-gray-500">
                            Rush
                        </p>
                        <p className="text-[15px] font-semibold text-white">
                            {formatStatNumber(rushingYards)}
                        </p>
                    </div>

                    <div className="bg-[#111] border border-white/8 rounded-lg px-2 py-2">
                        <p className="text-[9px] uppercase tracking-widest text-gray-500">
                            Rec
                        </p>
                        <p className="text-[15px] font-semibold text-white">
                            {formatStatNumber(receivingYards)}
                        </p>
                    </div>

                    <div className="bg-[#111] border border-white/8 rounded-lg px-2 py-2">
                        <p className="text-[9px] uppercase tracking-widest text-gray-500">
                            TDs
                        </p>
                        <p className="text-[15px] font-semibold text-white">
                            {formatStatNumber(totalTouchdowns)}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                            Top performers
                        </p>

                        {topPerformers.length > 0 ? (
                            <div className="space-y-1.5">
                                {topPerformers.slice(0, 4).map((performer) => (
                                    <div
                                        key={performer.label}
                                        className="flex items-center justify-between gap-2 text-[12px]"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-gray-500 text-[10px] uppercase tracking-widest">
                                                {performer.label}
                                            </p>
                                            <p className="text-white font-medium truncate">
                                                {performer.playerName}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-white font-semibold">
                                                {performer.value.toLocaleString()}
                                            </p>
                                            <p className="text-[10px] text-gray-500">
                                                {performer.unit || performer.statName}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[12px] text-gray-500">
                                No top performer data available.
                            </p>
                        )}
                    </div>

                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                            Staff
                        </p>

                        <div className="bg-[#111] border border-white/8 rounded-lg px-3 py-2">
                            <p className="text-[22px] font-semibold text-white leading-none">
                                {coaches.length}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">
                                active coaching assignments
                            </p>
                        </div>

                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-3 mb-2">
                            Positions
                        </p>

                        <div className="flex flex-wrap gap-1">
                            {Array.from(
                                new Set(players.map((player) => player.position).filter(Boolean))
                            )
                                .sort()
                                .map((position) => (
                                    <span
                                        key={position}
                                        className="text-[10px] px-2 py-0.5 rounded bg-white/6 text-gray-300 border border-white/8"
                                    >
                                        {position}
                                    </span>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PlayerDetailModal({
    player,
    stats,
    teamLabel,
    onClose,
}: {
    player: Player;
    stats: PlayerSeasonStat[];
    teamLabel: string;
    onClose: () => void;
}) {
    const name = displayName(player);
    const sortedStats = sortPlayerStats(stats);
    const groupedStats = groupStatsByCategory(sortedStats);
    const categories = Object.keys(groupedStats);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-2xl bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/8 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-lg font-semibold text-white">{name}</p>
                        <p className="text-[12px] text-gray-500 mt-0.5">
                            {player.position || "—"} · #{player.jersey_number ?? "—"} · {teamLabel}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white text-xl leading-none bg-transparent border-none cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-4">
                    {categories.length > 0 ? (
                        <div className="space-y-4">
                            {categories.map((category) => (
                                <div key={category}>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                                        {formatCategoryLabel(category)}
                                    </p>

                                    <div className="grid grid-cols-2 gap-2">
                                        {groupedStats[category].map((stat, index) => (
                                            <div
                                                key={
                                                    stat.player_season_stat_id ??
                                                    `${stat.stat_type_key}-${index}`
                                                }
                                                className="bg-[#111] border border-white/8 rounded-lg px-3 py-2"
                                            >
                                                <p className="text-[11px] text-gray-400 mb-1">
                                                    {stat.stat_type_name ||
                                                        stat.stat_type_key ||
                                                        "Unknown stat"}
                                                </p>

                                                <p className="text-xl font-semibold text-white leading-none">
                                                    {toNumber(stat.value).toLocaleString()}
                                                </p>

                                                {stat.stat_type_unit && (
                                                    <p className="text-[10px] text-gray-600 mt-1">
                                                        {stat.stat_type_unit}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-10 text-center text-sm text-gray-500">
                            No stats available for this player in the selected team and season.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
    const router = useRouter();

    const [authChecked, setAuthChecked] = useState(false);
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");

    const [activeSection, setActiveSection] = useState("dashboard");
    const [activeSeason, setActiveSeason] = useState("");

    const [showError, setShowError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [showSuccess, setShowSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const [players, setPlayers] = useState<Player[]>([]);
    const [playersLoaded, setPlayersLoaded] = useState(false);

    const [seasons, setSeasons] = useState<Season[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [activeTeamId, setActiveTeamId] = useState("");

    const [statTypes, setStatTypes] = useState<StatType[]>([]);
    const [playerSeasonStats, setPlayerSeasonStats] = useState<PlayerSeasonStat[]>([]);
    const [activeLeaderboardStatKey, setActiveLeaderboardStatKey] =
        useState("receiving_yards");

    const [coachAssignments, setCoachAssignments] = useState<CoachSeasonAssignment[]>([]);

    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

    const [leftComparisonPlayerId, setLeftComparisonPlayerId] = useState("");
    const [rightComparisonPlayerId, setRightComparisonPlayerId] = useState("");
    const [comparisonReport, setComparisonReport] =
        useState<PlayerComparisonReport | null>(null);
    const [comparisonError, setComparisonError] = useState("");

    const [loadingDashboardData, setLoadingDashboardData] = useState(true);
    const [loadingComparisonData, setLoadingComparisonData] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUsername = localStorage.getItem("username");
        const storedRole = localStorage.getItem("role");

        if (!token || storedRole !== "user") {
            router.push("/login");
            return;
        }

        setUsername(storedUsername || "User");
        setRole(storedRole || "");
        setAuthChecked(true);
    }, [router]);

    useEffect(() => {
        if (!authChecked) {
            return;
        }

        const loginMessage = sessionStorage.getItem("loginSuccess");

        if (loginMessage) {
            setSuccessMsg(loginMessage);
            setShowSuccess(true);
            sessionStorage.removeItem("loginSuccess");

            const timeout = setTimeout(() => {
                setShowSuccess(false);
            }, 5000);

            return () => clearTimeout(timeout);
        }
    }, [authChecked]);

    const showTemporaryError = useCallback((message: string) => {
        setErrorMsg(message);
        setShowError(true);

        const timeout = setTimeout(() => {
            setShowError(false);
        }, 5000);

        return () => clearTimeout(timeout);
    }, []);

    const seasonPills = useMemo(() => {
        return seasons
            .filter((season) => season.year !== undefined && season.year !== null)
            .map((season) => ({
                label: `${season.year} Season`,
            }));
    }, [seasons]);

    const playerList = players;

    const selectedSeasonYear =
        getSeasonYearFromLabel(activeSeason) ??
        (seasons[0]?.year ? String(seasons[0].year) : "");

    const comparisonPlayerIds = useMemo(() => {
        return players
            .map((player) => String(player.player_id ?? player.id ?? ""))
            .filter(Boolean);
    }, [players]);

    useEffect(() => {
        if (comparisonPlayerIds.length < 2) {
            setLeftComparisonPlayerId("");
            setRightComparisonPlayerId("");
            setComparisonReport(null);
            return;
        }

        const nextLeft =
            leftComparisonPlayerId && comparisonPlayerIds.includes(leftComparisonPlayerId)
                ? leftComparisonPlayerId
                : comparisonPlayerIds[0];

        const nextRight =
            rightComparisonPlayerId &&
            comparisonPlayerIds.includes(rightComparisonPlayerId) &&
            rightComparisonPlayerId !== nextLeft
                ? rightComparisonPlayerId
                : comparisonPlayerIds.find((id) => id !== nextLeft) ?? "";

        if (leftComparisonPlayerId !== nextLeft) {
            setLeftComparisonPlayerId(nextLeft);
        }

        if (rightComparisonPlayerId !== nextRight) {
            setRightComparisonPlayerId(nextRight);
        }
    }, [comparisonPlayerIds, leftComparisonPlayerId, rightComparisonPlayerId]);

    useEffect(() => {
        const fetchComparisonReport = async () => {
            if (
                !authChecked ||
                !activeTeamId ||
                !selectedSeasonYear ||
                !leftComparisonPlayerId ||
                !rightComparisonPlayerId ||
                leftComparisonPlayerId === rightComparisonPlayerId
            ) {
                setComparisonReport(null);
                return;
            }

            try {
                setLoadingComparisonData(true);
                setComparisonError("");

                const response = await reportAPI.getPlayerComparison({
                    left_player: leftComparisonPlayerId,
                    right_player: rightComparisonPlayerId,
                    team: activeTeamId,
                    year: selectedSeasonYear,
                });

                setComparisonReport(unwrapApiData<PlayerComparisonReport>(response));
            } catch (error) {
                console.error("Comparison report error:", error);
                setComparisonReport(null);
                setComparisonError("Failed to load SQL comparison report.");
            } finally {
                setLoadingComparisonData(false);
            }
        };

        fetchComparisonReport();
    }, [
        authChecked,
        activeTeamId,
        selectedSeasonYear,
        leftComparisonPlayerId,
        rightComparisonPlayerId,
    ]);

    const fetchDashboardData = useCallback(async () => {
        if (!authChecked) {
            return;
        }

        try {
            setLoadingDashboardData(true);

            const [seasonListRaw, teamListRaw] = await Promise.all([
                safeApiCall<unknown[]>(() => seasonAPI.getAllSeasons(), []),
                safeApiCall<unknown[]>(() => teamAPI.getAllTeams(), []),
            ]);

            const seasonList = normalizeApiList<Season>(seasonListRaw)
                .filter((season) => season.year !== undefined && season.year !== null)
                .sort((a, b) => Number(b.year) - Number(a.year));

            const teamList = normalizeApiList<Team>(teamListRaw)
                .filter((team) => team.team_id !== undefined || team.id !== undefined);

            setSeasons(seasonList);
            setTeams(teamList);

            let selectedTeamId = activeTeamId;

            if (!selectedTeamId && teamList.length > 0) {
                const preferredTeam =
                    teamList.find((team) => team.abbreviation === "GB") ?? teamList[0];

                const firstTeamId = preferredTeam.team_id ?? preferredTeam.id;

                if (firstTeamId !== undefined) {
                    selectedTeamId = String(firstTeamId);
                    setActiveTeamId(selectedTeamId);
                }
            }

            let resolvedSeasonYear = getSeasonYearFromLabel(activeSeason) ?? "";

            if (!resolvedSeasonYear && seasonList.length > 0) {
                resolvedSeasonYear = String(seasonList[0].year);
            }

            if (!activeSeason && resolvedSeasonYear) {
                setActiveSeason(`${resolvedSeasonYear} Season`);
            }

            const sharedParams = {
                ...(selectedTeamId ? { team: selectedTeamId } : {}),
                ...(resolvedSeasonYear ? { year: resolvedSeasonYear } : {}),
            };

            const [
                playerListResult,
                statTypeResult,
                playerSeasonStatsResult,
                coachAssignmentResult,
            ] = await Promise.all([
                safeApiCall<unknown[]>(
                    () => playerAPI.getAllPlayers(sharedParams),
                    []
                ),

                safeApiCall<unknown[]>(
                    () => statAPI.getStatTypes(),
                    []
                ),

                safeApiCall<unknown[]>(
                    () => statAPI.getPlayerSeasonStats(sharedParams),
                    []
                ),

                safeApiCall<unknown[]>(
                    () => coachAPI.getCoachSeasonAssignments(sharedParams),
                    []
                ),
            ]);

            const normalizedPlayers = normalizeApiList<Player>(playerListResult);
            const normalizedStatTypes = normalizeApiList<StatType>(statTypeResult);
            const normalizedPlayerSeasonStats =
                normalizeApiList<PlayerSeasonStat>(playerSeasonStatsResult);
            const normalizedCoachAssignments =
                normalizeApiList<CoachSeasonAssignment>(coachAssignmentResult);

            setPlayers(normalizedPlayers);
            setPlayersLoaded(true);
            setStatTypes(normalizedStatTypes);
            setPlayerSeasonStats(normalizedPlayerSeasonStats);
            setCoachAssignments(normalizedCoachAssignments);

            const noDashboardData =
                normalizedPlayers.length === 0 &&
                normalizedPlayerSeasonStats.length === 0 &&
                normalizedCoachAssignments.length === 0;

            if (noDashboardData) {
                showTemporaryError("No dashboard data available");
            }
        } catch (error) {
            console.error("Unexpected dashboard data error:", error);

            setPlayers([]);
            setPlayersLoaded(false);
            setSeasons([]);
            setTeams([]);
            setStatTypes([]);
            setPlayerSeasonStats([]);
            setCoachAssignments([]);
            setComparisonReport(null);

            showTemporaryError("No dashboard data available");
        } finally {
            setLoadingDashboardData(false);
        }
    }, [activeSeason, activeTeamId, authChecked, showTemporaryError]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch("http://localhost:8000/api/auth/logout/", {
                method: "POST",
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const data = await response.json();
                showTemporaryError(data.error || "Logout failed, please try again");
                return;
            }

            sessionStorage.setItem(
                "logoutSuccess",
                "You have been logged out successfully."
            );
        } catch (err) {
            console.error("Logout error:", err);

            sessionStorage.setItem(
                "logoutSuccess",
                "You have been logged out locally."
            );
        } finally {
            ["token", "user_id", "username", "role"].forEach((key) =>
                localStorage.removeItem(key)
            );

            router.push("/login");
        }
    };

    if (!authChecked || loadingDashboardData) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#111]">
                <LoadingSpinner />
            </div>
        );
    }

    const activeTeam =
        teams.find((team) => {
            const teamId = team.team_id ?? team.id;
            return String(teamId) === activeTeamId;
        }) ?? teams[0];

    const teamLabel = activeTeam
        ? `${activeTeam.abbreviation || activeTeam.display_name || activeTeam.team_name || "Team"}${
              selectedSeasonYear ? ` · ${selectedSeasonYear}` : ""
          }`
        : selectedSeasonYear
            ? `Team · ${selectedSeasonYear}`
            : "Team";

    const teamOptions: TeamOption[] = teams
        .filter((team) => team.team_id !== undefined || team.id !== undefined)
        .map((team) => {
            const teamId = team.team_id ?? team.id;
            const label =
                team.display_name ||
                `${team.city ?? ""} ${team.team_name ?? ""}`.trim() ||
                team.team_name ||
                "Unknown team";

            return {
                id: String(teamId),
                label,
            };
        });

    const activeTeamTheme = buildTeamTheme(activeTeam);

    const rosterSizeValue = playersLoaded ? playerList.length : undefined;

    const totalTouchdownsValue = sumStats(playerSeasonStats, [
        "passing_touchdowns",
        "rushing_touchdowns",
        "receiving_touchdowns",
    ]);

    const passingYardsValue = sumStats(playerSeasonStats, ["passing_yards"]);
    const rushingYardsValue = sumStats(playerSeasonStats, ["rushing_yards"]);

    const availableLeaderboardStatTypes = statTypes.filter((statType) =>
        playerSeasonStats.some((stat) => stat.stat_type_key === statType.key)
    );

    const resolvedLeaderboardStatKey =
        availableLeaderboardStatTypes.some(
            (statType) => statType.key === activeLeaderboardStatKey
        )
            ? activeLeaderboardStatKey
            : availableLeaderboardStatTypes[0]?.key ?? "";

    const selectedLeaderboardStatType = availableLeaderboardStatTypes.find(
        (statType) => statType.key === resolvedLeaderboardStatKey
    );

    const leaderboardRows = buildLeaderboardRows(
        playerSeasonStats,
        resolvedLeaderboardStatKey
    );

    const maxLeaderboardValue = Math.max(
        ...leaderboardRows.map((row) => getStatValue(row)),
        1
    );

    const sortedCoachAssignments = sortCoachAssignments(coachAssignments);

    const renderLeaderboardPanel = (limit?: number) => {
        const rows =
            typeof limit === "number"
                ? leaderboardRows.slice(0, limit)
                : leaderboardRows;

        return (
            <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
                    <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                        {selectedLeaderboardStatType?.name || "Stat leaderboard"}
                    </span>

                    <select
                        value={resolvedLeaderboardStatKey}
                        onChange={(event) => {
                            setActiveLeaderboardStatKey(event.target.value);
                            setActiveSection("leaderboard");
                        }}
                        className="bg-[#111] border border-white/10 rounded px-2 py-1 text-[10px] text-gray-300 outline-none focus:border-white/30"
                    >
                        {availableLeaderboardStatTypes.length > 0 ? (
                            availableLeaderboardStatTypes.map((statType) => (
                                <option key={statType.key} value={statType.key}>
                                    {statType.name}
                                </option>
                            ))
                        ) : (
                            <option value="">No stats</option>
                        )}
                    </select>
                </div>

                <ul>
                    {rows.length > 0 ? (
                        rows.map((row, index) => {
                            const name = getLeaderboardName(row);
                            const pos = row.position || "—";
                            const val = getStatValue(row);
                            const barPct = Math.round((val / maxLeaderboardValue) * 100);
                            const colorClass = AVATAR_COLORS[index % AVATAR_COLORS.length];

                            return (
                                <li
                                    key={getLeaderboardId(row, index)}
                                    className="flex items-center gap-2.5 px-3 py-1.5 border-b border-white/6 last:border-b-0 text-[12px]"
                                >
                                    <span
                                        className={`text-[10px] w-4 text-right shrink-0 ${
                                            index < 2
                                                ? "text-[#f0c040] font-medium"
                                                : "text-gray-500"
                                        }`}
                                    >
                                        {index + 1}
                                    </span>

                                    <span
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium shrink-0 ${colorClass}`}
                                    >
                                        <PlayerInitials name={name} />
                                    </span>

                                    <span className="flex-1 text-white truncate">{name}</span>
                                    <span className="text-[10px] text-gray-500 w-6">{pos}</span>

                                    <div className="w-12 h-[3px] bg-white/8 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#c49a22] rounded-full"
                                            style={{ width: `${barPct}%` }}
                                        />
                                    </div>

                                    <span className="text-[12px] font-medium text-white w-10 text-right">
                                        {val.toLocaleString()}
                                    </span>
                                </li>
                            );
                        })
                    ) : (
                        <li className="px-3 py-4 text-center text-gray-500 text-sm">
                            No leaderboard data available
                        </li>
                    )}
                </ul>
            </div>
        );
    };

    const renderRosterPanel = (limit?: number, title = "Active roster") => {
        const rows = typeof limit === "number" ? playerList.slice(0, limit) : playerList;

        return (
            <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
                    <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                        {title}
                    </span>

                    {limit && playerList.length > limit && (
                        <button
                            onClick={() => setActiveSection("players")}
                            className="text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                        >
                            View all →
                        </button>
                    )}
                </div>

                <ul>
                    {rows.length > 0 ? (
                        rows.map((player, index) => {
                            const name = displayName(player);
                            const pos = player.position || "—";
                            const num = player.jersey_number ?? "—";
                            const active = player.is_active !== false;

                            return (
                                <li
                                    key={getPlayerId(player, index)}
                                    onClick={() => setSelectedPlayer(player)}
                                    className="flex items-center gap-2 px-3 py-1.5 border-b border-white/6 last:border-b-0 text-[12px] hover:bg-white/3 cursor-pointer transition-colors"
                                >
                                    <span className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-medium bg-[#1a3d28] text-[#f0c040] shrink-0">
                                        {num}
                                    </span>

                                    <span className="flex-1 text-white truncate">{name}</span>

                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/6 text-gray-400">
                                        {pos}
                                    </span>

                                    <span
                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                            active ? "bg-emerald-500" : "bg-white/20"
                                        }`}
                                    />
                                </li>
                            );
                        })
                    ) : (
                        <li className="px-3 py-4 text-center text-gray-500 text-sm">
                            No players found in roster
                        </li>
                    )}
                </ul>
            </div>
        );
    };

    const renderCoachesPanel = () => (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
                <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                    Coaching staff
                </span>

                <span className="text-[10px] text-gray-500">
                    {teamLabel}
                </span>
            </div>

            <div className="grid grid-cols-[1.4fr_1.2fr_100px_100px] gap-3 px-3 py-2 border-b border-white/8 text-[10px] uppercase tracking-widest text-gray-500">
                <span>Coach</span>
                <span>Role</span>
                <span>Status</span>
                <span className="text-right">Season</span>
            </div>

            {sortedCoachAssignments.length > 0 ? (
                sortedCoachAssignments.map((assignment) => {
                    const active = assignment.is_active !== false;

                    return (
                        <div
                            key={assignment.assignment_id}
                            className="grid grid-cols-[1.4fr_1.2fr_100px_100px] gap-3 items-center px-3 py-2 border-b border-white/6 last:border-b-0 text-[12px] hover:bg-white/3"
                        >
                            <span className="text-white font-medium truncate">
                                {assignment.coach_full_name ||
                                    `${assignment.coach_first_name ?? ""} ${assignment.coach_last_name ?? ""}`.trim() ||
                                    "Unknown coach"}
                            </span>

                            <span className="text-gray-400 truncate">
                                {assignment.role || "—"}
                            </span>

                            <span>
                                <span
                                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                                        active
                                            ? "bg-emerald-900/40 text-emerald-400"
                                            : "bg-white/5 text-gray-500"
                                    }`}
                                >
                                    <span
                                        className={`w-1 h-1 rounded-full inline-block ${
                                            active ? "bg-emerald-400" : "bg-gray-600"
                                        }`}
                                    />
                                    {active ? "Active" : "Inactive"}
                                </span>
                            </span>

                            <span className="text-gray-400 text-right">
                                {assignment.season_year ?? selectedSeasonYear ?? "—"}
                            </span>
                        </div>
                    );
                })
            ) : (
                <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                    No coaches found for this team and season.
                </div>
            )}
        </div>
    );

    const renderTeamRosterPanel = () => (
        <div className="space-y-3">
            {renderRosterPanel(undefined, "Team roster")}
            {renderCoachesPanel()}
        </div>
    );

    const renderComparisonPanel = () => (
        <PlayerComparisonPanel
            players={playerList}
            report={comparisonReport}
            loading={loadingComparisonData}
            error={comparisonError}
            leftPlayerId={leftComparisonPlayerId}
            rightPlayerId={rightComparisonPlayerId}
            onLeftPlayerChange={setLeftComparisonPlayerId}
            onRightPlayerChange={setRightComparisonPlayerId}
            teamLabel={teamLabel}
        />
    );

    const renderPlayerStatsPanel = (limit?: number) => {
        const rows =
            typeof limit === "number"
                ? playerList.slice(0, limit)
                : playerList;

        return (
            <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
                    <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                        Player stats
                    </span>

                    <span className="text-[10px] text-gray-500">
                        {teamLabel}
                    </span>
                </div>

                <div className="grid grid-cols-[1.4fr_80px_80px_2fr_100px] gap-3 px-3 py-2 border-b border-white/8 text-[10px] uppercase tracking-widest text-gray-500">
                    <span>Player</span>
                    <span>Position</span>
                    <span>Number</span>
                    <span>Stat preview</span>
                    <span className="text-right">Actions</span>
                </div>

                {rows.length > 0 ? (
                    rows.map((player, index) => {
                        const playerStats = sortPlayerStats(
                            getStatsForPlayer(player, playerSeasonStats)
                        );

                        const previewStats = playerStats.slice(0, 3);
                        const remainingCount = Math.max(playerStats.length - previewStats.length, 0);

                        return (
                            <div
                                key={getPlayerId(player, index)}
                                onClick={() => setSelectedPlayer(player)}
                                className="grid grid-cols-[1.4fr_80px_80px_2fr_100px] gap-3 items-center px-3 py-2 border-b border-white/6 last:border-b-0 text-[12px] hover:bg-white/3 cursor-pointer transition-colors"
                            >
                                <span className="text-white font-medium truncate">
                                    {displayName(player)}
                                </span>

                                <span className="text-gray-400">
                                    {player.position || "—"}
                                </span>

                                <span className="text-gray-400">
                                    #{player.jersey_number ?? "—"}
                                </span>

                                <span className="text-gray-400 truncate">
                                    {previewStats.length > 0 ? (
                                        <>
                                            {previewStats.map((stat, statIndex) => (
                                                <span
                                                    key={
                                                        stat.player_season_stat_id ??
                                                        `${stat.stat_type_key}-${statIndex}`
                                                    }
                                                >
                                                    {stat.stat_type_name}:{" "}
                                                    <span className="text-white">
                                                        {toNumber(stat.value).toLocaleString()}
                                                    </span>
                                                    {statIndex < previewStats.length - 1 ? " · " : ""}
                                                </span>
                                            ))}

                                            {remainingCount > 0 && (
                                                <span className="text-gray-500">
                                                    {" "}· +{remainingCount} more
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        "No stats"
                                    )}
                                </span>

                                <div className="flex justify-end">
                                    <button
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setSelectedPlayer(player);
                                        }}
                                        className="text-[10px] px-2 py-1 rounded border border-white/10 text-gray-300 hover:text-white hover:border-white/30 transition-colors bg-transparent cursor-pointer"
                                    >
                                        View details
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                        No players available for this team and season.
                    </div>
                )}
            </div>
        );
    };

    const renderStatTypesPanel = () => (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
                <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                    Stat types
                </span>

                <span className="text-[10px] text-gray-500">
                    {statTypes.length} available
                </span>
            </div>

            <div className="grid grid-cols-[1fr_1fr_90px_2fr] gap-3 px-3 py-2 border-b border-white/8 text-[10px] uppercase tracking-widest text-gray-500">
                <span>Key</span>
                <span>Name</span>
                <span>Category</span>
                <span>Description</span>
            </div>

            {statTypes.length > 0 ? (
                statTypes.map((statType) => (
                    <div
                        key={statType.stat_type_id ?? statType.key}
                        className="grid grid-cols-[1fr_1fr_90px_2fr] gap-3 items-center px-3 py-2 border-b border-white/6 last:border-b-0 text-[12px] hover:bg-white/3"
                    >
                        <span className="text-gray-400 font-mono text-[11px] truncate">
                            {statType.key || "—"}
                        </span>

                        <span className="text-white truncate">
                            {statType.name || "—"}
                        </span>

                        <span className="text-gray-500">
                            {statType.category || "—"}
                        </span>

                        <span className="text-gray-500 truncate">
                            {statType.description || "No description"}
                        </span>
                    </div>
                ))
            ) : (
                <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                    No stat types available.
                </div>
            )}
        </div>
    );

    const renderDashboardOverview = () => (
        <>
            <div className="grid grid-cols-4 gap-2">
                <StatCard label="Roster size" value={noData(rosterSizeValue)} />

                <StatCard
                    label="Total TDs"
                    value={formatStatNumber(totalTouchdownsValue)}
                />

                <StatCard
                    label="Pass yards"
                    value={formatStatNumber(passingYardsValue)}
                />

                <StatCard
                    label="Rush yards"
                    value={formatStatNumber(rushingYardsValue)}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                {renderLeaderboardPanel(5)}
                {renderRosterPanel(5)}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <CompactSeasonSummaryCard
                    players={playerList}
                    stats={playerSeasonStats}
                    coaches={coachAssignments}
                    teamLabel={teamLabel}
                    selectedSeasonYear={selectedSeasonYear}
                    onViewFullSummary={() => setActiveSection("season-summary")}
                />
                {renderComparisonPanel()}
            </div>
        </>
    );

    const renderDashboardContent = () => {
        switch (activeSection) {
            case "dashboard":
                return renderDashboardOverview();

            case "season-summary":
                return (
                    <SeasonSummaryPanel
                        players={playerList}
                        stats={playerSeasonStats}
                        coaches={coachAssignments}
                        teamLabel={teamLabel}
                        selectedSeasonYear={selectedSeasonYear}
                    />
                );

            case "players":
                return renderRosterPanel(undefined, "Players");

            case "coaches":
                return renderCoachesPanel();

            case "team-roster":
                return renderTeamRosterPanel();

            case "player-stats":
                return renderPlayerStatsPanel();

            case "stat-types":
                return renderStatTypesPanel();

            case "leaderboard":
                return renderLeaderboardPanel();

            case "comparison":
                return renderComparisonPanel();

            default:
                return (
                    <EmptySection
                        title="Dashboard section unavailable"
                        description="No content has been implemented for this section yet."
                    />
                );
        }
    };

    return (
        <PageLayout
            username={username}
            role={role}
            onLogout={handleLogout}
            navSections={USER_NAV}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            title={getSectionTitle(activeSection)}
            seasonPills={seasonPills}
            activeSeason={activeSeason}
            onSeasonChange={(season) => {
                setActiveSeason(season);
                setSelectedPlayer(null);
                setComparisonReport(null);
                setComparisonError("");
            }}
            teamLabel={teamLabel}
            theme={activeTeamTheme}
            teamOptions={teamOptions}
            activeTeamId={activeTeamId}
            onTeamChange={(teamId) => {
                setActiveTeamId(teamId);
                setSelectedPlayer(null);
                setComparisonReport(null);
                setComparisonError("");
                setLeftComparisonPlayerId("");
                setRightComparisonPlayerId("");
                setActiveSection("dashboard");
            }}
        >
            {showSuccess && successMsg && (
                <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-950 border border-emerald-800 text-emerald-300 text-sm px-4 py-3 rounded-lg shadow-xl max-w-sm">
                    <span className="flex-1">{successMsg}</span>
                    <button
                        onClick={() => setShowSuccess(false)}
                        className="text-emerald-400 hover:text-emerald-200 text-lg leading-none cursor-pointer bg-transparent border-none"
                    >
                        ✕
                    </button>
                </div>
            )}

            {showError && errorMsg && (
                <div className="fixed top-20 right-5 z-50 flex items-center gap-3 bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg shadow-xl max-w-sm">
                    <span className="flex-1">{errorMsg}</span>
                    <button
                        onClick={() => setShowError(false)}
                        className="text-red-400 hover:text-red-200 text-lg leading-none cursor-pointer bg-transparent border-none"
                    >
                        ✕
                    </button>
                </div>
            )}

            {renderDashboardContent()}

            {selectedPlayer && (
                <PlayerDetailModal
                    player={selectedPlayer}
                    stats={getStatsForPlayer(selectedPlayer, playerSeasonStats)}
                    teamLabel={teamLabel}
                    onClose={() => setSelectedPlayer(null)}
                />
            )}
        </PageLayout>
    );
}