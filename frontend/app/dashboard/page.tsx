"use client";

import React, {
    startTransition,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
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
import PageLayout, {
    LayoutTheme,
    NavSection,
    TeamOption,
} from "@/src/components/pageLayout";
import Toast from "@/src/components/ui/Toast";

import { useAuthGuard } from "@/src/hooks/useAuthGuard";
import { useToast } from "@/src/hooks/useToast";

import {
    CoachSeasonAssignment,
    Player,
    PlayerComparisonReport,
    PlayerSeasonStat,
    Season,
    StatType,
    Team,
    TopPerformer,
} from "@/src/types/dashboard";

import {
    normalizeApiList,
    safeApiCall,
    unwrapApiData,
} from "@/src/utils/apiData";

import {
    buildLeaderboardRows,
    displayPlayerName,
    formatStatNumber,
    getLeaderboardId,
    getLeaderboardName,
    getSeasonYearFromLabel,
    getStablePlayerId,
    getStatValue,
    getStatsForPlayer,
    getTopPerformer,
    isCoreStatKey,
    noData,
    sortCoachAssignments,
    sortPlayerStats,
    sumStats,
    toNumber,
} from "@/src/utils/stats";

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
            { label: "Team Roster", section: "team-roster" },
        ],
    },
    {
        heading: "Stats",
        items: [
            { label: "Player Stats", section: "player-stats" },
            { label: "Statistic Types", section: "stat-types" },
            { label: "Leaderboard", section: "leaderboard" },
            { label: "Comparison", section: "comparison" },
        ],
    },
];

const PLAYER_DATA_SECTIONS = new Set([
    "dashboard",
    "season-summary",
    "players",
    "team-roster",
    "player-stats",
    "leaderboard",
    "comparison",
]);

const STAT_DATA_SECTIONS = new Set([
    "dashboard",
    "season-summary",
    "player-stats",
    "leaderboard",
]);

const COACH_DATA_SECTIONS = new Set([
    "dashboard",
    "season-summary",
    "coaches",
    "team-roster",
]);

const STAT_TYPE_DATA_SECTIONS = new Set([
    "dashboard",
    "stat-types",
    "leaderboard",
]);

const COMPARISON_DATA_SECTIONS = new Set(["dashboard", "comparison"]);

const AVATAR_COLORS = [
    "bg-[#c49a22]/20 text-[#f0c040]",
    "bg-emerald-900/40 text-emerald-400",
    "bg-blue-900/40 text-blue-400",
    "bg-rose-900/40 text-rose-400",
    "bg-violet-900/40 text-violet-400",
];

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

function getTeamSeasonCacheKey(teamId: string, year: string): string {
    return `${teamId}:${year}`;
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

function getPlayerId(player: Player, index?: number): number | string {
    return (
        player.id ??
        player.player_id ??
        `${displayPlayerName(player)}-${player.jersey_number ?? index ?? "unknown"}`
    );
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

function PlayerAvatar({
    player,
    size = "sm",
}: {
    player: Player;
    size?: "sm" | "md" | "lg";
}) {
    const name = displayPlayerName(player);

    const sizeClasses = {
        sm: "w-7 h-7 text-[9px]",
        md: "w-10 h-10 text-xs",
        lg: "w-16 h-16 text-sm",
    };

    if (player.headshot_url) {
        return (
            <img
                src={player.headshot_url}
                alt={name}
                loading={size === "sm" ? "lazy" : "eager"}
                decoding="async"
                className={`${sizeClasses[size]} rounded-full object-cover border border-white/10 bg-[#111] shrink-0`}
            />
        );
    }

    return (
        <span
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center bg-[#1a3d28] text-[#f0c040] font-medium shrink-0`}
        >
            <PlayerInitials name={name} />
        </span>
    );
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
                                new Set(
                                    players
                                        .map((player) => player.position)
                                        .filter(Boolean)
                                )
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
    loading,
    error,
    onClose,
}: {
    player: Player;
    stats: PlayerSeasonStat[];
    teamLabel: string;
    loading: boolean;
    error: string;
    onClose: () => void;
}) {
    const name = displayPlayerName(player);
    const sortedStats = sortPlayerStats(stats);
    const groupedStats = groupStatsByCategory(sortedStats);
    const categories = Object.keys(groupedStats);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-2xl bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden">
                <div className="px-4 py-4 border-b border-white/8 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <PlayerAvatar player={player} size="lg" />

                        <div className="min-w-0">
                            <p className="text-lg font-semibold text-white truncate">
                                {name}
                            </p>

                            <p className="text-[12px] text-gray-500 mt-0.5">
                                {player.position || "—"} · #{player.jersey_number ?? "—"} ·{" "}
                                {teamLabel}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white text-xl leading-none bg-transparent border-none cursor-pointer shrink-0"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-4">
                    {loading ? (
                        <div className="py-10 text-center text-sm text-gray-500">
                            Loading player stats...
                        </div>
                    ) : error ? (
                        <div className="py-10 text-center text-sm text-red-400">
                            {error}
                        </div>
                    ) : categories.length > 0 ? (
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

export default function DashboardPage() {
    const router = useRouter();
    const { authChecked, username, role } = useAuthGuard("user");
    const { toast, showSuccess, showError, hideToast } = useToast();

    const referenceLoadedRef = useRef(false);
    const playersCacheRef = useRef<Record<string, Player[]>>({});
    const statsCacheRef = useRef<Record<string, PlayerSeasonStat[]>>({});
    const coachesCacheRef = useRef<Record<string, CoachSeasonAssignment[]>>({});
    const statTypesCacheRef = useRef<Record<string, StatType[]>>({});
    const playerDetailStatsCacheRef = useRef<Record<string, PlayerSeasonStat[]>>({});

    const [activeSection, setActiveSection] = useState("dashboard");
    const [activeSeason, setActiveSeason] = useState("");

    const [players, setPlayers] = useState<Player[]>([]);
    const [playersLoaded, setPlayersLoaded] = useState(false);

    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [selectedPlayerStats, setSelectedPlayerStats] = useState<PlayerSeasonStat[]>([]);
    const [loadingSelectedPlayerStats, setLoadingSelectedPlayerStats] = useState(false);
    const [selectedPlayerStatsError, setSelectedPlayerStatsError] = useState("");

    const [seasons, setSeasons] = useState<Season[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [activeTeamId, setActiveTeamId] = useState("");

    const [statTypes, setStatTypes] = useState<StatType[]>([]);
    const [playerSeasonStats, setPlayerSeasonStats] = useState<PlayerSeasonStat[]>([]);
    const [activeLeaderboardStatKey, setActiveLeaderboardStatKey] =
        useState("receiving_yards");

    const [coachAssignments, setCoachAssignments] = useState<CoachSeasonAssignment[]>([]);

    const [leftComparisonPlayerId, setLeftComparisonPlayerId] = useState("");
    const [rightComparisonPlayerId, setRightComparisonPlayerId] = useState("");
    const [comparisonReport, setComparisonReport] =
        useState<PlayerComparisonReport | null>(null);
    const [comparisonError, setComparisonError] = useState("");

    const [initialLoading, setInitialLoading] = useState(true);
    const [sectionLoading, setSectionLoading] = useState(false);
    const [loadingComparisonData, setLoadingComparisonData] = useState(false);

    const handleSectionChange = useCallback((section: string) => {
        startTransition(() => {
            setActiveSection(section);
        });
    }, []);

    useEffect(() => {
        if (!authChecked) {
            return;
        }

        const loginMessage = sessionStorage.getItem("loginSuccess");

        if (loginMessage) {
            showSuccess(loginMessage);
            sessionStorage.removeItem("loginSuccess");
        }
    }, [authChecked, showSuccess]);

    useEffect(() => {
        if (!authChecked || referenceLoadedRef.current) {
            return;
        }

        let cancelled = false;

        const fetchReferenceData = async () => {
            referenceLoadedRef.current = true;

            try {
                setInitialLoading(true);

                const [seasonListRaw, teamListRaw] = await Promise.all([
                    safeApiCall<unknown[]>(() => seasonAPI.getAllSeasons(), []),
                    safeApiCall<unknown[]>(() => teamAPI.getAllTeams(), []),
                ]);

                if (cancelled) {
                    return;
                }

                const seasonList = normalizeApiList<Season>(seasonListRaw)
                    .filter((season) => season.year !== undefined && season.year !== null)
                    .sort((a, b) => Number(b.year) - Number(a.year));

                const teamList = normalizeApiList<Team>(teamListRaw).filter(
                    (team) => team.team_id !== undefined || team.id !== undefined
                );

                setSeasons(seasonList);
                setTeams(teamList);

                const preferredTeam =
                    teamList.find((team) => team.abbreviation === "GB") ?? teamList[0];

                const preferredTeamId = preferredTeam?.team_id ?? preferredTeam?.id;

                if (preferredTeamId !== undefined) {
                    setActiveTeamId(String(preferredTeamId));
                }

                if (seasonList[0]?.year !== undefined && seasonList[0]?.year !== null) {
                    setActiveSeason(`${seasonList[0].year} Season`);
                }
            } catch (error) {
                console.error("Reference data error:", error);

                if (!cancelled) {
                    setSeasons([]);
                    setTeams([]);
                    showError("Failed to load dashboard reference data.");
                }
            } finally {
                if (!cancelled) {
                    setInitialLoading(false);
                }
            }
        };

        fetchReferenceData();

        return () => {
            cancelled = true;
        };
    }, [authChecked, showError]);

    const seasonPills = useMemo(() => {
        return seasons
            .filter((season) => season.year !== undefined && season.year !== null)
            .map((season) => ({
                label: `${season.year} Season`,
            }));
    }, [seasons]);

    const selectedSeasonYear =
        getSeasonYearFromLabel(activeSeason) ??
        (seasons[0]?.year ? String(seasons[0].year) : "");

    useEffect(() => {
        if (
            !authChecked ||
            initialLoading ||
            !activeTeamId ||
            !selectedSeasonYear
        ) {
            return;
        }

        let cancelled = false;

        const fetchSectionData = async () => {
            const cacheKey = getTeamSeasonCacheKey(activeTeamId, selectedSeasonYear);

            const sharedParams = {
                team: activeTeamId,
                year: selectedSeasonYear,
            };

            const shouldLoadPlayers = PLAYER_DATA_SECTIONS.has(activeSection);
            const shouldLoadStats = STAT_DATA_SECTIONS.has(activeSection);
            const shouldLoadCoaches = COACH_DATA_SECTIONS.has(activeSection);
            const shouldLoadStatTypes = STAT_TYPE_DATA_SECTIONS.has(activeSection);
            const shouldLoadAllStatTypes = activeSection === "stat-types";

            const statTypeCacheKey = shouldLoadAllStatTypes ? "all" : "core";

            const needsPlayersFetch =
                shouldLoadPlayers && !playersCacheRef.current[cacheKey];

            const needsStatsFetch =
                shouldLoadStats && !statsCacheRef.current[cacheKey];

            const needsCoachesFetch =
                shouldLoadCoaches && !coachesCacheRef.current[cacheKey];

            const needsStatTypesFetch =
                shouldLoadStatTypes && !statTypesCacheRef.current[statTypeCacheKey];

            const hasAnyMissingData =
                needsPlayersFetch ||
                needsStatsFetch ||
                needsCoachesFetch ||
                needsStatTypesFetch;

            try {
                setSectionLoading(hasAnyMissingData);

                const [
                    playerListResult,
                    statTypeResult,
                    playerSeasonStatsResult,
                    coachAssignmentResult,
                ] = await Promise.all([
                    shouldLoadPlayers
                        ? (async () => {
                              const cachedPlayers = playersCacheRef.current[cacheKey];

                              if (cachedPlayers) {
                                  return cachedPlayers;
                              }

                              const rawPlayers = await safeApiCall<unknown[]>(
                                  () => playerAPI.getPlayersWithoutStats(sharedParams),
                                  []
                              );

                              const normalizedPlayers =
                                  normalizeApiList<Player>(rawPlayers);

                              playersCacheRef.current[cacheKey] = normalizedPlayers;

                              return normalizedPlayers;
                          })()
                        : Promise.resolve(null),

                    shouldLoadStatTypes
                        ? (async () => {
                              const cachedStatTypes =
                                  statTypesCacheRef.current[statTypeCacheKey];

                              if (cachedStatTypes) {
                                  return cachedStatTypes;
                              }

                              const rawStatTypes = await safeApiCall<unknown[]>(
                                  () =>
                                      shouldLoadAllStatTypes
                                          ? statAPI.getAllStatTypes()
                                          : statAPI.getCoreStatTypes(),
                                  []
                              );

                              const normalizedStatTypes =
                                  normalizeApiList<StatType>(rawStatTypes);

                              statTypesCacheRef.current[statTypeCacheKey] =
                                  normalizedStatTypes;

                              return normalizedStatTypes;
                          })()
                        : Promise.resolve(null),

                    shouldLoadStats
                        ? (async () => {
                              const cachedStats = statsCacheRef.current[cacheKey];

                              if (cachedStats) {
                                  return cachedStats;
                              }

                              const rawStats = await safeApiCall<unknown[]>(
                                  () => statAPI.getCorePlayerSeasonStats(sharedParams),
                                  []
                              );

                              const normalizedStats =
                                  normalizeApiList<PlayerSeasonStat>(rawStats);

                              statsCacheRef.current[cacheKey] = normalizedStats;

                              return normalizedStats;
                          })()
                        : Promise.resolve(null),

                    shouldLoadCoaches
                        ? (async () => {
                              const cachedCoaches = coachesCacheRef.current[cacheKey];

                              if (cachedCoaches) {
                                  return cachedCoaches;
                              }

                              const rawCoaches = await safeApiCall<unknown[]>(
                                  () => coachAPI.getCoachSeasonAssignments(sharedParams),
                                  []
                              );

                              const normalizedCoaches =
                                  normalizeApiList<CoachSeasonAssignment>(rawCoaches);

                              coachesCacheRef.current[cacheKey] = normalizedCoaches;

                              return normalizedCoaches;
                          })()
                        : Promise.resolve(null),
                ]);

                if (cancelled) {
                    return;
                }

                if (playerListResult !== null) {
                    setPlayers(playerListResult);
                    setPlayersLoaded(true);
                }

                if (statTypeResult !== null) {
                    setStatTypes(statTypeResult);
                }

                if (playerSeasonStatsResult !== null) {
                    setPlayerSeasonStats(playerSeasonStatsResult);
                }

                if (coachAssignmentResult !== null) {
                    setCoachAssignments(coachAssignmentResult);
                }

                const noDashboardData =
                    (playerListResult?.length ?? players.length) === 0 &&
                    (playerSeasonStatsResult?.length ?? playerSeasonStats.length) === 0 &&
                    (coachAssignmentResult?.length ?? coachAssignments.length) === 0 &&
                    (statTypeResult?.length ?? statTypes.length) === 0;

                const shouldWarnAboutEmptyDashboard =
                    activeSection === "dashboard" || activeSection === "season-summary";

                if (shouldWarnAboutEmptyDashboard && noDashboardData) {
                    showError("No dashboard data available");
                }
            } catch (error) {
                console.error("Section data error:", error);

                if (!cancelled) {
                    showError("Failed to load section data.");
                }
            } finally {
                if (!cancelled) {
                    setSectionLoading(false);
                }
            }
        };

        fetchSectionData();

        return () => {
            cancelled = true;
        };
    }, [
        activeSection,
        activeTeamId,
        authChecked,
        coachAssignments.length,
        initialLoading,
        playerSeasonStats.length,
        players.length,
        selectedSeasonYear,
        showError,
        statTypes.length,
    ]);

    useEffect(() => {
        if (
            !authChecked ||
            initialLoading ||
            !activeTeamId ||
            !selectedSeasonYear
        ) {
            return;
        }

        let cancelled = false;

        const prefetchDashboardData = async () => {
            const cacheKey = getTeamSeasonCacheKey(activeTeamId, selectedSeasonYear);

            const sharedParams = {
                team: activeTeamId,
                year: selectedSeasonYear,
            };

            try {
                const [rawPlayers, rawStats, rawCoaches, rawStatTypes] =
                    await Promise.all([
                        playersCacheRef.current[cacheKey]
                            ? Promise.resolve(playersCacheRef.current[cacheKey])
                            : safeApiCall<unknown[]>(
                                  () => playerAPI.getPlayersWithoutStats(sharedParams),
                                  []
                              ),

                        statsCacheRef.current[cacheKey]
                            ? Promise.resolve(statsCacheRef.current[cacheKey])
                            : safeApiCall<unknown[]>(
                                  () => statAPI.getCorePlayerSeasonStats(sharedParams),
                                  []
                              ),

                        coachesCacheRef.current[cacheKey]
                            ? Promise.resolve(coachesCacheRef.current[cacheKey])
                            : safeApiCall<unknown[]>(
                                  () => coachAPI.getCoachSeasonAssignments(sharedParams),
                                  []
                              ),

                        statTypesCacheRef.current.core
                            ? Promise.resolve(statTypesCacheRef.current.core)
                            : safeApiCall<unknown[]>(
                                  () => statAPI.getCoreStatTypes(),
                                  []
                              ),
                    ]);

                if (cancelled) {
                    return;
                }

                const normalizedPlayers = Array.isArray(rawPlayers)
                    ? normalizeApiList<Player>(rawPlayers)
                    : [];

                const normalizedStats = Array.isArray(rawStats)
                    ? normalizeApiList<PlayerSeasonStat>(rawStats)
                    : [];

                const normalizedCoaches = Array.isArray(rawCoaches)
                    ? normalizeApiList<CoachSeasonAssignment>(rawCoaches)
                    : [];

                const normalizedStatTypes = Array.isArray(rawStatTypes)
                    ? normalizeApiList<StatType>(rawStatTypes)
                    : [];

                playersCacheRef.current[cacheKey] = normalizedPlayers;
                statsCacheRef.current[cacheKey] = normalizedStats;
                coachesCacheRef.current[cacheKey] = normalizedCoaches;
                statTypesCacheRef.current.core = normalizedStatTypes;

                setPlayers(normalizedPlayers);
                setPlayersLoaded(true);
                setPlayerSeasonStats(normalizedStats);
                setCoachAssignments(normalizedCoaches);
                setStatTypes(normalizedStatTypes);
            } catch (error) {
                console.error("Dashboard prefetch error:", error);
            }
        };

        prefetchDashboardData();

        return () => {
            cancelled = true;
        };
    }, [
        activeTeamId,
        authChecked,
        initialLoading,
        selectedSeasonYear,
    ]);

    useEffect(() => {
        if (players.length === 0) {
            return;
        }

        players.slice(0, 80).forEach((player) => {
            if (!player.headshot_url) {
                return;
            }

            const image = new Image();
            image.src = player.headshot_url;
        });
    }, [players]);

    const playerList = players;

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
                !COMPARISON_DATA_SECTIONS.has(activeSection) ||
                !activeTeamId ||
                !selectedSeasonYear ||
                !leftComparisonPlayerId ||
                !rightComparisonPlayerId ||
                leftComparisonPlayerId === rightComparisonPlayerId
            ) {
                setComparisonReport(null);
                setComparisonError("");
                setLoadingComparisonData(false);
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
        activeSection,
        activeTeamId,
        authChecked,
        leftComparisonPlayerId,
        rightComparisonPlayerId,
        selectedSeasonYear,
    ]);

    const handleOpenPlayerDetails = useCallback(
        async (player: Player) => {
            const playerId = getStablePlayerId(player);

            setSelectedPlayer(player);
            setSelectedPlayerStats([]);
            setSelectedPlayerStatsError("");

            if (playerId === undefined) {
                setSelectedPlayerStatsError(
                    "Unable to load stats because the player ID is missing."
                );
                return;
            }

            const cacheKey = `${playerId}:${activeTeamId}:${selectedSeasonYear}:core`;
            const cachedStats = playerDetailStatsCacheRef.current[cacheKey];

            if (cachedStats) {
                setSelectedPlayerStats(cachedStats);
                return;
            }

            try {
                setLoadingSelectedPlayerStats(true);

                const response = await playerAPI.getPlayerSeasonStats(playerId, {
                    team: activeTeamId,
                    year: selectedSeasonYear,
                    stat_scope: "core",
                });

                const data = unwrapApiData<{
                    stats?: PlayerSeasonStat[];
                }>(response);

                const normalizedStats = normalizeApiList<PlayerSeasonStat>(
                    data.stats ?? []
                );

                playerDetailStatsCacheRef.current[cacheKey] = normalizedStats;

                setSelectedPlayerStats(normalizedStats);
            } catch (error) {
                console.error("Player detail stats error:", error);
                setSelectedPlayerStatsError("Failed to load player stats.");
            } finally {
                setLoadingSelectedPlayerStats(false);
            }
        },
        [activeTeamId, selectedSeasonYear]
    );

    const closePlayerDetails = useCallback(() => {
        setSelectedPlayer(null);
        setSelectedPlayerStats([]);
        setSelectedPlayerStatsError("");
        setLoadingSelectedPlayerStats(false);
    }, []);

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch("http://127.0.0.1:8000/api/auth/logout/", {
                method: "POST",
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                sessionStorage.setItem(
                    "logoutSuccess",
                    "You have been logged out successfully."
                );
            } else {
                sessionStorage.setItem(
                    "logoutSuccess",
                    "You have been logged out locally."
                );
            }
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

    if (!authChecked || initialLoading) {
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

    const availableLeaderboardStatTypes = statTypes.filter(
        (statType) =>
            isCoreStatKey(statType.key) &&
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
                            handleSectionChange("leaderboard");
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
                            onClick={() => handleSectionChange("players")}
                            className="text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                        >
                            View all →
                        </button>
                    )}
                </div>

                <ul>
                    {rows.length > 0 ? (
                        rows.map((player, index) => {
                            const name = displayPlayerName(player);
                            const pos = player.position || "—";
                            const active = player.is_active !== false;

                            return (
                                <li
                                    key={getPlayerId(player, index)}
                                    onClick={() => handleOpenPlayerDetails(player)}
                                    className="flex items-center gap-2 px-3 py-1.5 border-b border-white/6 last:border-b-0 text-[12px] hover:bg-white/3 cursor-pointer transition-colors"
                                >
                                    <PlayerAvatar player={player} size="sm" />

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

                <span className="text-[10px] text-gray-500">{teamLabel}</span>
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
            {renderCoachesPanel()}
            {renderRosterPanel(undefined, "Team Roster")}
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

                    <span className="text-[10px] text-gray-500">{teamLabel}</span>
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
                        const remainingCount = Math.max(
                            playerStats.length - previewStats.length,
                            0
                        );

                        return (
                            <div
                                key={getPlayerId(player, index)}
                                onClick={() => handleOpenPlayerDetails(player)}
                                className="grid grid-cols-[1.4fr_80px_80px_2fr_100px] gap-3 items-center px-3 py-2 border-b border-white/6 last:border-b-0 text-[12px] hover:bg-white/3 cursor-pointer transition-colors"
                            >
                                <span className="text-white font-medium truncate">
                                    {displayPlayerName(player)}
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
                                                    {statIndex < previewStats.length - 1
                                                        ? " · "
                                                        : ""}
                                                </span>
                                            ))}

                                            {remainingCount > 0 && (
                                                <span className="text-gray-500">
                                                    {" "}
                                                    · +{remainingCount} more
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
                                            handleOpenPlayerDetails(player);
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
                    onViewFullSummary={() => handleSectionChange("season-summary")}
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
            onSectionChange={handleSectionChange}
            title={getSectionTitle(activeSection)}
            seasonPills={seasonPills}
            activeSeason={activeSeason}
            onSeasonChange={(season) => {
                setActiveSeason(season);
                closePlayerDetails();
                setComparisonReport(null);
                setComparisonError("");
            }}
            teamLabel={teamLabel}
            theme={activeTeamTheme}
            teamOptions={teamOptions}
            activeTeamId={activeTeamId}
            onTeamChange={(teamId) => {
                setActiveTeamId(teamId);
                closePlayerDetails();
                setComparisonReport(null);
                setComparisonError("");
                setLeftComparisonPlayerId("");
                setRightComparisonPlayerId("");
                handleSectionChange("dashboard");
            }}
        >
            {toast.show && toast.message && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={hideToast}
                    offset={toast.type === "success" ? "top" : "lower"}
                />
            )}

            {sectionLoading && (
                <div className="rounded-lg border border-white/8 bg-[#1a1a1a] px-3 py-2 text-[11px] text-gray-400">
                    Updating {getSectionTitle(activeSection).toLowerCase()} data...
                </div>
            )}

            {renderDashboardContent()}

            {selectedPlayer && (
                <PlayerDetailModal
                    player={selectedPlayer}
                    stats={selectedPlayerStats}
                    teamLabel={teamLabel}
                    loading={loadingSelectedPlayerStats}
                    error={selectedPlayerStatsError}
                    onClose={closePlayerDetails}
                />
            )}
        </PageLayout>
    );
}