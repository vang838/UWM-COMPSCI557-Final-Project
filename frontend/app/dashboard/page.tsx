'use client';

import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {dashboardAPI} from "@/src/api";
import {playerAPI} from "@/src/api/players";
import {seasonAPI} from "@/src/api/seasons";
import {teamAPI} from "@/src/api/teams";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import PageLayout, {NavSection, LayoutTheme, TeamOption} from "@/src/components/pageLayout";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Player {
    id?: number;
    player_id?: number;
    first_name?: string;
    last_name?: string;
    name?: string;
    position?: string;
    jersey_number?: number | string;
    is_active?: boolean;
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

interface DashboardStats {
    roster_size?: number;
    total_tds?: number;
    pass_yards_per_game?: number;
    rush_yards_per_game?: number;
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

interface SeasonBarData {
    year: string;
    height: number;
    current: boolean;
}

interface PlayerComparisonData {
    label: string;
    l: number;
    r: number;
    lv: string;
    rv: string;
}

// Nav config
const USER_NAV: NavSection[] = [
    {
        heading: "Overview",
        items: [
            {label: "Dashboard", section: "dashboard"},
            {label: "Season summary", section: "season-summary"},
        ],
    },
    {
        heading: "Roster",
        items: [
            {label: "Players", section: "players"},
            {label: "Coaches", section: "coaches"},
            {label: "Team roster", section: "team-roster"},
        ],
    },
    {
        heading: "Stats",
        items: [
            {label: "Player stats", section: "player-stats"},
            {label: "Stat types", section: "stat-types"},
            {label: "Leaderboard", section: "leaderboard"},
            {label: "Comparison", section: "comparison"},
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

// Helpers
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

function getStatValue(row: LeaderboardRow): number {
    const rawValue = row.stat_value ?? row.value ?? row.total ?? 0;
    const numericValue = Number(rawValue);
    return Number.isFinite(numericValue) ? numericValue : 0;
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
// Small helper components
// ---------------------------------------------------------------------------
function EmptySection({
                          title,
                          description,
                      }: {
    title: string;
    description: string;
}) {
    return (
        <div
            className="bg-[#1a1a1a] border border-white/8 rounded-lg p-6 min-h-[220px] flex flex-col items-center justify-center text-center">
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

function PlayerInitials({name}: { name: string }) {
    const parts = name.trim().split(" ").filter(Boolean);

    const initials =
        parts.length >= 2
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`
            : name.slice(0, 2);

    return <>{initials.toUpperCase()}</>;
}

// Page component
export default function DashboardPage() {
    const router = useRouter();

    const [authChecked, setAuthChecked] = useState(false);
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");

    const [activeSection, setActiveSection] = useState("dashboard");
    const [activeSeason, setActiveSeason] = useState("");

    const [showError, setShowError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [players, setPlayers] = useState<Player[]>([]);
    const [playersLoaded, setPlayersLoaded] = useState(false);

    const [seasons, setSeasons] = useState<Season[]>([]);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
        null
    );
    const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
    const [seasonBars, setSeasonBars] = useState<SeasonBarData[]>([]);

    // No real comparison endpoint currently exists in frontend/src/api.
    // Keep the state empty so the UI displays "No comparison data available".
    const [comparisonData, setComparisonData] = useState<PlayerComparisonData[]>(
        []
    );

    const [teams, setTeams] = useState<Team[]>([]);
    const [activeTeamId, setActiveTeamId] = useState("");

    const [loadingDashboardData, setLoadingDashboardData] = useState(true);
    const [loadingSeasonData, setLoadingSeasonData] = useState(true);
    const [loadingComparisonData, setLoadingComparisonData] = useState(false);

    // Auth guard
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
    const rosterPreview = playerList.slice(0, 5);

    const fetchDashboardData = useCallback(async () => {
        if (!authChecked) {
            return;
        }

        try {
            setLoadingDashboardData(true);
            setLoadingSeasonData(true);
            setLoadingComparisonData(false);
            setComparisonData([]);

            const [seasonListRaw, teamListRaw] = await Promise.all([
                safeApiCall<unknown[]>(
                    () => seasonAPI.getAllSeasons(),
                    []
                ),
                safeApiCall<unknown[]>(
                    () => teamAPI.getAllTeams(),
                    []
                ),
            ]);

            const seasonList = normalizeApiList<Season>(seasonListRaw)
                .filter((season) => season.year !== undefined && season.year !== null)
                .sort((a, b) => Number(b.year) - Number(a.year));

            const teamList = normalizeApiList<Team>(teamListRaw)
                .filter((team) => team.team_id !== undefined || team.id !== undefined);

            setSeasons(seasonList);
            setTeams(teamList);

            if (!activeTeamId && teamList.length > 0) {
                const firstTeamId = teamList[0].team_id ?? teamList[0].id;
                if (firstTeamId !== undefined) {
                    setActiveTeamId(String(firstTeamId));
                }
            }

            let selectedSeasonYear = getSeasonYearFromLabel(activeSeason) ?? "";

            if (!selectedSeasonYear && seasonList.length > 0) {
                selectedSeasonYear = String(seasonList[0].year);
            }

            if (!activeSeason && selectedSeasonYear) {
                setActiveSeason(`${selectedSeasonYear} Season`);
            }

            const leaderboardParams = selectedSeasonYear
                ? {season: selectedSeasonYear}
                : {};

            const [
                playerListResult,
                dashboardStatsResult,
                leaderboardResult,
                seasonPerformanceResult,
            ] = await Promise.all([
                safeApiCall<unknown[]>(() => playerAPI.getAllPlayers(), []),
                safeApiCall<DashboardStats | null>(
                    () => dashboardAPI.getDashboardStats(),
                    null
                ),
                safeApiCall<unknown[]>(
                    () => dashboardAPI.getPlayerLeaderboard(leaderboardParams),
                    []
                ),
                safeApiCall<unknown[]>(() => dashboardAPI.getSeasonPerformance(), []),
            ]);

            const normalizedPlayers = normalizeApiList<Player>(playerListResult);
            const normalizedLeaderboard =
                normalizeApiList<LeaderboardRow>(leaderboardResult);
            const seasonPerformanceData =
                normalizeApiList<any>(seasonPerformanceResult);

            setPlayers(normalizedPlayers);
            setPlayersLoaded(true);
            setDashboardStats(dashboardStatsResult);
            setLeaderboard(normalizedLeaderboard);

            const values = seasonPerformanceData.map((item) => {
                const rawValue =
                    item.rushing_yards ??
                    item.rush_yards ??
                    item.total_rushing_yards ??
                    item.value ??
                    0;

                const numericValue = Number(rawValue);
                return Number.isFinite(numericValue) ? numericValue : 0;
            });

            const maxValue = Math.max(...values, 0);

            const transformedSeasonBars = seasonPerformanceData.map((item, index) => {
                const value = values[index];

                const year = String(item.year ?? item.season_year ?? "Unknown");

                const height =
                    maxValue > 0
                        ? Math.max(4, Math.round((value / maxValue) * 80))
                        : 0;

                return {
                    year,
                    height,
                    current: selectedSeasonYear ? year === selectedSeasonYear : index === 0,
                };
            });

            setSeasonBars(transformedSeasonBars);

            const noDashboardData =
                normalizedPlayers.length === 0 &&
                !dashboardStatsResult &&
                normalizedLeaderboard.length === 0 &&
                transformedSeasonBars.length === 0;

            if (noDashboardData) {
                showTemporaryError("No dashboard data available");
            }
        } catch (error) {
            console.error("Unexpected dashboard data error:", error);

            setPlayers([]);
            setPlayersLoaded(false);
            setSeasons([]);
            setDashboardStats(null);
            setLeaderboard([]);
            setSeasonBars([]);
            setComparisonData([]);

            showTemporaryError("No dashboard data available");
        } finally {
            setLoadingDashboardData(false);
            setLoadingSeasonData(false);
            setLoadingComparisonData(false);
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
        } catch (err) {
            console.error("Logout error:", err);
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
                <LoadingSpinner/>
            </div>
        );
    }

    const rosterSizeValue =
        dashboardStats?.roster_size ??
        (playersLoaded ? playerList.length : undefined);

    const maxLeaderboardValue = Math.max(
        ...leaderboard.map((row) => getStatValue(row)),
        1
    );

    const activeTeam =
        teams.find((team) => {
            const teamId = team.team_id ?? team.id;
            return String(teamId) === activeTeamId;
        }) ?? teams[0];

    const selectedSeasonYear =
        getSeasonYearFromLabel(activeSeason) ??
        (seasons[0]?.year ? String(seasons[0].year) : "");

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

    const renderLeaderboardPanel = (limit?: number) => {
        const rows = typeof limit === "number" ? leaderboard.slice(0, limit) : leaderboard;

        return (
            <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
          <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
            Stat leaderboard
          </span>

                    <button
                        onClick={() => setActiveSection("leaderboard")}
                        className="text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                    >
                        Receiving yds ▾
                    </button>
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
                    <PlayerInitials name={name}/>
                  </span>

                                    <span className="flex-1 text-white truncate">{name}</span>
                                    <span className="text-[10px] text-gray-500 w-6">{pos}</span>

                                    <div className="w-12 h-0.75 bg-white/8 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#c49a22] rounded-full"
                                            style={{width: `${barPct}%`}}
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
                                    className="flex items-center gap-2 px-3 py-1.5 border-b border-white/6 last:border-b-0 text-[12px] hover:bg-white/3 cursor-pointer transition-colors"
                                >
                  <span
                      className="w-5.5 h-5.5 rounded flex items-center justify-center text-[9px] font-medium bg-[#1a3d28] text-[#f0c040] shrink-0">
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

    const renderSeasonChart = () => (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
        <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
          Rushing yds by season
        </span>

                <button
                    onClick={() => setActiveSection("season-summary")}
                    className="text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                >
                    5-yr view
                </button>
            </div>

            <div className="px-3 py-3 min-h-[190px] flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                    {loadingSeasonData ? (
                        <p className="text-gray-500 text-sm">Loading season data...</p>
                    ) : seasonBars.length > 0 ? (
                        <div className="flex items-end gap-1.5 h-20 w-full">
                            {seasonBars.map((bar) => (
                                <div
                                    key={bar.year}
                                    className="flex-1 flex flex-col items-center gap-1"
                                >
                                    <div
                                        className={`w-full rounded-t-sm ${
                                            bar.current ? "bg-[#c49a22]" : "bg-white/10"
                                        }`}
                                        style={{height: `${bar.height}px`}}
                                    />

                                    <span
                                        className={`text-[9px] ${
                                            bar.current
                                                ? "text-[#f0c040] font-medium"
                                                : "text-gray-500"
                                        }`}
                                    >
                    {bar.year}
                  </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No season data available</p>
                    )}
                </div>

                <div className="flex gap-3 mt-auto pt-2">
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c49a22] inline-block"/>
                        Current season
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/15 inline-block"/>
                        Prior seasons
                    </div>
                </div>
            </div>
        </div>
    );

    const renderComparisonPanel = () => (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
        <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
          Player comparison
        </span>

                <button
                    onClick={() => setActiveSection("comparison")}
                    className="text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                >
                    Change players ↗
                </button>
            </div>

            <div className="px-3 py-3">
                <div className="flex gap-2 mb-3">
                    <div className="flex-1 text-center">
                        <p className="text-[11px] font-medium text-[#f0c040]">
                            {playerList[0] ? displayName(playerList[0]) : "No player selected"}
                        </p>
                        <p className="text-[10px] text-gray-500">
                            {playerList[0]?.position ?? "—"} · #
                            {playerList[0]?.jersey_number ?? "—"}
                        </p>
                    </div>

                    <div className="flex items-center text-[10px] text-gray-500">vs</div>

                    <div className="flex-1 text-center">
                        <p className="text-[11px] font-medium text-blue-400">
                            {playerList[1] ? displayName(playerList[1]) : "No player selected"}
                        </p>
                        <p className="text-[10px] text-gray-500">
                            {playerList[1]?.position ?? "—"} · #
                            {playerList[1]?.jersey_number ?? "—"}
                        </p>
                    </div>
                </div>

                {loadingComparisonData ? (
                    <div className="flex items-center justify-center h-32">
                        <p className="text-gray-500 text-sm">Loading comparison data...</p>
                    </div>
                ) : comparisonData.length > 0 ? (
                    comparisonData.map((row) => (
                        <div key={row.label} className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] font-medium text-white w-8 text-right">
                {row.lv}
              </span>

                            <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden flex justify-end">
                                <div
                                    className="h-full bg-[#c49a22] rounded-full"
                                    style={{width: `${row.l}%`}}
                                />
                            </div>

                            <span className="text-[10px] text-gray-500 w-16 text-center shrink-0">
                {row.label}
              </span>

                            <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{width: `${row.r}%`}}
                                />
                            </div>

                            <span className="text-[11px] font-medium text-white w-8">
                {row.rv}
              </span>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center h-32">
                        <p className="text-gray-500 text-sm">No comparison data available</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderDashboardOverview = () => (
        <>
            <div className="grid grid-cols-4 gap-2">
                <StatCard label="Roster size" value={noData(rosterSizeValue)}/>
                <StatCard label="Total TDs" value={noData(dashboardStats?.total_tds)}/>
                <StatCard
                    label="Pass yds / gm"
                    value={noData(dashboardStats?.pass_yards_per_game)}
                />
                <StatCard
                    label="Rush yds / gm"
                    value={noData(dashboardStats?.rush_yards_per_game)}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                {renderLeaderboardPanel(5)}
                {renderRosterPanel(5)}
            </div>

            <div className="grid grid-cols-2 gap-3">
                {renderSeasonChart()}
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
                    <>
                        {renderSeasonChart()}
                        <EmptySection
                            title="Season summary"
                            description="This section should show season-level summaries once the backend summary API is available."
                        />
                    </>
                );

            case "players":
                return renderRosterPanel(undefined, "Players");

            case "coaches":
                return (
                    <EmptySection
                        title="Coaches"
                        description="This section should show coaching staff once the coaches API is available."
                    />
                );

            case "team-roster":
                return (
                    <EmptySection
                        title="Team roster"
                        description="This section should show roster assignments by team and season."
                    />
                );

            case "player-stats":
                return (
                    <EmptySection
                        title="Player stats"
                        description="This section should show player-level statistics once the stats API is available."
                    />
                );

            case "stat-types":
                return (
                    <EmptySection
                        title="Stat types"
                        description="This section should show the supported stat categories."
                    />
                );

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
            onSeasonChange={setActiveSeason}
            teamLabel={teamLabel}
            theme={activeTeamTheme}
            teamOptions={teamOptions}
            activeTeamId={activeTeamId}
            onTeamChange={(teamId) => {
                setActiveTeamId(teamId);
                setActiveSection("dashboard");
            }}
        >
            {showError && errorMsg && (
                <div
                    className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg shadow-xl max-w-sm">
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
        </PageLayout>
    );
}