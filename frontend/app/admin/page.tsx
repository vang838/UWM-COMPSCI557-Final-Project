'use client';

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import PageLayout, { NavSection, LayoutTheme } from "@/src/components/pageLayout";

import { playerAPI } from "@/src/api/players";
import { seasonAPI } from "@/src/api/seasons";
import { teamAPI } from "@/src/api/teams";
import { statAPI } from "@/src/api/stats";
import { coachAPI } from "@/src/api/coaches";
import { reportAPI } from "@/src/api/reports";

import SeasonSummaryPanel from "@/src/components/dashboard/SeasonSummaryPanel";
import PlayerComparisonPanel from "@/src/components/dashboard/PlayerComparisonPanel";
import AdminPlayerRecords from "@/src/components/admin/AdminPlayerRecords";
import AdminUserRolesPanel from "@/src/components/admin/AdminUserRolesPanel";

import { useApiData } from "@/src/hooks/useApiData";

// Types
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

interface PlayerFormData {
    first_name: string;
    last_name: string;
    position: string;
    team: string;
    is_active: boolean;
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

interface TeamFormData {
    city: string;
    state: string;
    team_name: string;
    conference: string;
    division: string;
    abbreviation: string;
    primary_color: string;
    secondary_color: string;
    text_color: string;
}

interface SeasonFormData {
    year: string;
}

interface TeamSeason {
    team_season_id: number;
    team: number;
    season: number;
    season_year?: number;
    team_name?: string;
    team_city?: string;
    team_display_name?: string;
    team_abbreviation?: string;
    conference?: string;
    division?: string;
}

interface PlayerSeasonRoster {
    roster_id: number;
    player: number;
    player_name?: string;
    player_position?: string;
    team_season: number;
    team_season_id?: number;
    team_id?: number;
    team_display_name?: string;
    team_abbreviation?: string;
    season_id?: number;
    season_year?: number;
    conference?: string;
    division?: string;
    jersey_number?: number | null;
    roster_status?: string;
    is_active?: boolean;
}

interface RosterFormData {
    player: string;
    jersey_number: string;
    roster_status: string;
    is_active: boolean;
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

// Nav config
const ADMIN_NAV: NavSection[] = [
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
    {
        heading: "Admin",
        items: [
            { label: "User roles", section: "user-roles", adminOnly: true },
            { label: "Manage seasons", section: "manage-seasons", adminOnly: true },
            { label: "Manage teams", section: "manage-teams", adminOnly: true },
        ],
    },
];

// UI customization
const ADMIN_THEME: Partial<LayoutTheme> = {
    sidebarBg: "#111827",
    sidebarText: "#ffffff",
    sidebarMutedText: "rgba(255, 255, 255, 0.5)",
    sidebarHoverBg: "rgba(255, 255, 255, 0.06)",
    accent: "#94a3b8",
    activeBg: "rgba(148, 163, 184, 0.16)",
    activeText: "#e5e7eb",
    dotInactive: "rgba(255, 255, 255, 0.25)",
    roleBadgeBg: "rgba(148, 163, 184, 0.18)",
    roleBadgeText: "#e5e7eb",
};

const COACH_ROLE_ORDER: Record<string, number> = {
    "Head Coach": 1,
    "Offensive Coordinator": 2,
    "Defensive Coordinator": 3,
    "Special Teams Coordinator": 4,
};

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

function displayPlayerName(player: Player): string {
    return (
        player.name ||
        `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim() ||
        "Unknown player"
    );
}

function getPlayerId(player: Player): number | string {
    return player.id ?? player.player_id ?? crypto.randomUUID();
}

function getStablePlayerId(player: Player): number | string | undefined {
    return player.player_id ?? player.id;
}

function playerToFormData(player: Player): PlayerFormData {
    return {
        first_name: player.first_name ?? "",
        last_name: player.last_name ?? "",
        position: player.position ?? "",
        team: player.team ? String(player.team) : "",
        is_active: player.is_active !== false,
    };
}

function noData(value: unknown): string | number {
    if (value === null || value === undefined || value === "") {
        return "No data";
    }

    return value as string | number;
}

function getTeamId(team: Team): number | string | undefined {
    return team.team_id ?? team.id;
}

function getTeamDisplayName(team: Team): string {
    return (
        team.display_name ||
        `${team.city ?? ""} ${team.team_name ?? ""}`.trim() ||
        team.team_name ||
        "Unknown team"
    );
}

function isValidHexColor(value: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function safeColorValue(value: string): string {
    return isValidHexColor(value) ? value : "#000000";
}

function teamToFormData(team: Team): TeamFormData {
    return {
        city: team.city ?? "",
        state: team.state ?? "",
        team_name: team.team_name ?? "",
        conference: team.conference ?? "",
        division: team.division ?? "",
        abbreviation: team.abbreviation ?? "",
        primary_color: team.primary_color ?? "#1a3d28",
        secondary_color: team.secondary_color ?? "#f0c040",
        text_color: team.text_color ?? "#ffffff",
    };
}

function getSeasonId(season: Season): number | string | undefined {
    return season.season_id ?? season.id;
}

function seasonToFormData(season: Season): SeasonFormData {
    return {
        year: season.year ? String(season.year) : "",
    };
}

function isValidSeasonYear(year: string): boolean {
    const parsedYear = Number(year);
    return Number.isInteger(parsedYear) && parsedYear >= 1920 && parsedYear <= 2030;
}

function getSectionTitle(section: string): string {
    const titles: Record<string, string> = {
        dashboard: "Admin Dashboard",
        "season-summary": "Season Summary",
        players: "Manage Players",
        coaches: "Manage Coaches",
        "team-roster": "Team Roster",
        "player-stats": "Player Stats",
        "stat-types": "Stat Types",
        leaderboard: "Leaderboard",
        comparison: "Player Comparison",
        "manage-seasons": "Manage Seasons",
        "manage-teams": "Manage Teams",
        "user-roles": "User Roles",
    };

    return titles[section] ?? "Admin Dashboard";
}

function toNumber(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
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
    return toNumber(rawValue);
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

// Small components
function StatCard({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                {label}
            </p>
            <p className="text-[22px] font-medium text-white leading-none">
                {value}
            </p>
        </div>
    );
}

function AdminActionCard({
    title,
    description,
    actions,
    onSectionChange,
}: {
    title: string;
    description: string;
    actions: { label: string; section?: string }[];
    onSectionChange: (section: string) => void;
}) {
    return (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg p-4">
            <p className="text-[13px] font-medium text-white mb-1">{title}</p>
            <p className="text-[11px] text-gray-500 mb-3">{description}</p>

            <div className="flex flex-wrap gap-1.5">
                {actions.map((action) => (
                    <button
                        key={action.label}
                        onClick={() => {
                            if (action.section) {
                                onSectionChange(action.section);
                            }
                        }}
                        className="text-[10px] px-2.5 py-1 rounded border border-white/10 text-gray-300 hover:border-[#c49a22]/50 hover:text-[#f0c040] transition-colors cursor-pointer bg-transparent"
                    >
                        {action.label}
                    </button>
                ))}
            </div>
        </div>
    );
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

function PlayerRecordsTable({
    players,
    onEdit,
    onDelete,
}: {
    players: Player[];
    onEdit: (player: Player) => void;
    onDelete: (player: Player) => void;
}) {
    return (
        <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                Player records ({players.length})
            </p>

            <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 px-3 py-2 border-b border-white/8 text-[10px] uppercase tracking-widest text-gray-500">
                    <span>Name</span>
                    <span>Position</span>
                    <span>Team</span>
                    <span>Status</span>
                    <span>Actions</span>
                </div>

                {players.length > 0 ? (
                    players.map((player) => {
                        const active = player.is_active !== false;

                        return (
                            <div
                                key={getPlayerId(player)}
                                className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 items-center px-3 py-2 border-b border-white/6 last:border-b-0 hover:bg-white/3 transition-colors text-[12px]"
                            >
                                <span className="text-white font-medium truncate">
                                    {displayPlayerName(player)}
                                </span>

                                <span className="text-gray-400">
                                    {player.position || "—"}
                                </span>

                                <span className="text-gray-400">
                                    {player.team ? `#${player.team}` : "—"}
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

                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => onEdit(player)}
                                        className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => onDelete(player)}
                                        className="text-[10px] px-2 py-0.5 rounded border border-red-900/50 text-red-500 hover:border-red-700 hover:text-red-300 transition-colors cursor-pointer bg-transparent"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                        No players found.
                    </div>
                )}
            </div>
        </div>
    );
}

function AdminOverview({
    players,
    seasons,
    teams,
    onSectionChange,
    onEditPlayer,
    onDeletePlayer,
}: {
    players: Player[];
    seasons: Season[];
    teams: Team[];
    onSectionChange: (section: string) => void;
    onEditPlayer: (player: Player) => void;
    onDeletePlayer: (player: Player) => void;
}) {
    const activePlayers = players.filter((player) => player.is_active !== false);

    return (
        <>
            <div className="grid grid-cols-4 gap-2">
                <StatCard label="Total players" value={players.length} />
                <StatCard label="Active players" value={activePlayers.length} />
                <StatCard label="Teams" value={noData(teams.length)} />
                <StatCard label="Seasons" value={noData(seasons.length)} />
            </div>

            <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                    Management
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <AdminActionCard
                        title="Players"
                        description="Manage player records, roster status, and player profile information."
                        actions={[
                            { label: "View players", section: "players" },
                            { label: "Add player", section: "players" },
                            { label: "Edit player", section: "players" },
                        ]}
                        onSectionChange={onSectionChange}
                    />

                    <AdminActionCard
                        title="Teams & seasons"
                        description="Manage seasons, teams, and roster assignments."
                        actions={[
                            { label: "Manage teams", section: "manage-teams" },
                            { label: "Manage seasons", section: "manage-seasons" },
                            { label: "Team roster", section: "team-roster" },
                        ]}
                        onSectionChange={onSectionChange}
                    />

                    <AdminActionCard
                        title="Coaches"
                        description="Track coaching staff history and assignments by team or season."
                        actions={[
                            { label: "View coaches", section: "coaches" },
                            { label: "Add coach", section: "coaches" },
                        ]}
                        onSectionChange={onSectionChange}
                    />

                    <AdminActionCard
                        title="Statistics"
                        description="Create stat types and enter or correct player season statistics."
                        actions={[
                            { label: "Player stats", section: "player-stats" },
                            { label: "Stat types", section: "stat-types" },
                            { label: "Leaderboard", section: "leaderboard" },
                        ]}
                        onSectionChange={onSectionChange}
                    />
                </div>
            </div>

            <AdminPlayerRecords
                players={players}
                teams={teams}
                onEdit={onEditPlayer}
                onDelete={onDeletePlayer}
                title="Player records"
                description="Filter or group player records before editing."
                pageSize={10}
            />
        </>
    );
}

function SeasonsPanel({
    seasons,
    onAdd,
    onEdit,
    onDelete,
}: {
    seasons: Season[];
    onAdd: () => void;
    onEdit: (season: Season) => void;
    onDelete: (season: Season) => void;
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-gray-500">
                    Seasons ({seasons.length})
                </p>

                <button
                    onClick={onAdd}
                    className="text-[10px] px-2.5 py-1 rounded border border-white/10 text-gray-300 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent"
                >
                    Add season
                </button>
            </div>

            <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-3 py-2 border-b border-white/8 text-[10px] uppercase tracking-widest text-gray-500">
                    <span>Season ID</span>
                    <span>Year</span>
                    <span>Actions</span>
                </div>

                {seasons.length > 0 ? (
                    seasons.map((season) => (
                        <div
                            key={season.season_id ?? season.id ?? season.year}
                            className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center px-3 py-2 border-b border-white/6 last:border-b-0 hover:bg-white/3 transition-colors text-[12px]"
                        >
                            <span className="text-gray-400">
                                {season.season_id ?? season.id ?? "—"}
                            </span>
                            <span className="text-white font-medium">{season.year}</span>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => onEdit(season)}
                                    className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent"
                                >
                                    Edit
                                </button>

                                <button
                                    onClick={() => onDelete(season)}
                                    className="text-[10px] px-2 py-0.5 rounded border border-red-900/50 text-red-500 hover:border-red-700 hover:text-red-300 transition-colors cursor-pointer bg-transparent"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                        No seasons found.
                    </div>
                )}
            </div>
        </div>
    );
}

function TeamsPanel({
    teams,
    onEdit,
    onDelete,
}: {
    teams: Team[];
    onEdit: (team: Team) => void;
    onDelete: (team: Team) => void;
}) {
    const teamGrid =
        "grid grid-cols-[minmax(220px,1.6fr)_80px_120px_120px_100px_120px] gap-3";

    return (
        <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                Teams ({teams.length})
            </p>

            <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
                <div
                    className={`${teamGrid} px-3 py-2 border-b border-white/8 text-[10px] uppercase tracking-widest text-gray-500`}
                >
                    <span className="flex items-center justify-start">Team</span>
                    <span className="flex items-center justify-center">ABBR.</span>
                    <span className="flex items-center justify-center">Conference</span>
                    <span className="flex items-center justify-center">Division</span>
                    <span className="flex items-center justify-center">Theme</span>
                    <span className="flex items-center justify-center">Actions</span>
                </div>

                {teams.length > 0 ? (
                    teams.map((team) => (
                        <div
                            key={team.team_id ?? team.id ?? team.team_name}
                            className={`${teamGrid} items-center px-3 py-2 border-b border-white/6 last:border-b-0 hover:bg-white/3 transition-colors text-[12px]`}
                        >
                            <span className="text-white font-medium truncate text-left">
                                {getTeamDisplayName(team)}
                            </span>

                            <span className="flex items-center justify-center text-gray-400">
                                {team.abbreviation || "—"}
                            </span>

                            <span className="flex items-center justify-center text-gray-400">
                                {team.conference || "—"}
                            </span>

                            <span className="flex items-center justify-center text-gray-400">
                                {team.division || "—"}
                            </span>

                            <span className="flex items-center justify-center gap-1.5">
                                <span
                                    className="w-3 h-3 rounded-full border border-white/20"
                                    style={{
                                        backgroundColor: team.primary_color || "#1a3d28",
                                    }}
                                />
                                <span
                                    className="w-3 h-3 rounded-full border border-white/20"
                                    style={{
                                        backgroundColor: team.secondary_color || "#f0c040",
                                    }}
                                />
                            </span>

                            <div className="flex items-center justify-center gap-1.5">
                                <button
                                    onClick={() => onEdit(team)}
                                    className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(team)}
                                    className="text-[10px] px-2 py-0.5 rounded border border-red-900/50 text-red-500 hover:border-red-700 hover:text-red-300 transition-colors cursor-pointer bg-transparent"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                        No teams found.
                    </div>
                )}
            </div>
        </div>
    );
}

function AdminDataFilterPanel({
    seasons,
    teams,
    selectedSeasonYear,
    selectedTeamId,
    onSeasonChange,
    onTeamChange,
}: {
    seasons: Season[];
    teams: Team[];
    selectedSeasonYear: string;
    selectedTeamId: string;
    onSeasonChange: (year: string) => void;
    onTeamChange: (teamId: string) => void;
}) {
    return (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                    <p className="text-[13px] font-medium text-white">
                        Dashboard data filters
                    </p>
                    <p className="text-[11px] text-gray-500">
                        Select the team and season used for admin dashboard reports.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">
                        Season
                    </span>
                    <select
                        value={selectedSeasonYear}
                        onChange={(event) => onSeasonChange(event.target.value)}
                        className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                    >
                        <option value="">Select season</option>
                        {seasons.map((season) => (
                            <option
                                key={season.season_id ?? season.id ?? season.year}
                                value={String(season.year)}
                            >
                                {season.year}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">
                        Team
                    </span>
                    <select
                        value={selectedTeamId}
                        onChange={(event) => onTeamChange(event.target.value)}
                        className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                    >
                        <option value="">Select team</option>
                        {teams.map((team) => {
                            const teamId = getTeamId(team);

                            if (teamId === undefined) {
                                return null;
                            }

                            return (
                                <option key={teamId} value={String(teamId)}>
                                    {getTeamDisplayName(team)}
                                </option>
                            );
                        })}
                    </select>
                </label>
            </div>
        </div>
    );
}

function CoachesReadOnlyPanel({
    assignments,
    teamLabel,
    loading,
}: {
    assignments: CoachSeasonAssignment[];
    teamLabel: string;
    loading: boolean;
}) {
    const sortedAssignments = sortCoachAssignments(assignments);

    return (
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

            {loading ? (
                <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                    Loading coaches...
                </div>
            ) : sortedAssignments.length > 0 ? (
                sortedAssignments.map((assignment) => {
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
                                {assignment.season_year ?? "—"}
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
}

function PlayerStatsReadOnlyPanel({
    players,
    stats,
    teamLabel,
    loading,
}: {
    players: Player[];
    stats: PlayerSeasonStat[];
    teamLabel: string;
    loading: boolean;
}) {
    return (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
                <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                    Player stats
                </span>
                <span className="text-[10px] text-gray-500">{teamLabel}</span>
            </div>

            <div className="grid grid-cols-[1.4fr_80px_80px_2fr] gap-3 px-3 py-2 border-b border-white/8 text-[10px] uppercase tracking-widest text-gray-500">
                <span>Player</span>
                <span>Position</span>
                <span>Number</span>
                <span>Stat preview</span>
            </div>

            {loading ? (
                <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                    Loading player stats...
                </div>
            ) : players.length > 0 ? (
                players.map((player) => {
                    const playerStats = sortPlayerStats(getStatsForPlayer(player, stats));
                    const previewStats = playerStats.slice(0, 3);
                    const remainingCount = Math.max(playerStats.length - previewStats.length, 0);

                    return (
                        <div
                            key={getPlayerId(player)}
                            className="grid grid-cols-[1.4fr_80px_80px_2fr] gap-3 items-center px-3 py-2 border-b border-white/6 last:border-b-0 text-[12px] hover:bg-white/3"
                        >
                            <span className="text-white font-medium truncate">
                                {displayPlayerName(player)}
                            </span>

                            <span className="text-gray-400">{player.position || "—"}</span>

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
}

function StatTypesReadOnlyPanel({
    statTypes,
    loading,
}: {
    statTypes: StatType[];
    loading: boolean;
}) {
    return (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
                <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                    Stat types
                </span>
                <span className="text-[10px] text-gray-500">
                    {statTypes.length} available
                </span>
            </div>

            <div className="grid grid-cols-[1fr_1fr_90px_90px_2fr] gap-3 px-3 py-2 border-b border-white/8 text-[10px] uppercase tracking-widest text-gray-500">
                <span>Key</span>
                <span>Name</span>
                <span>Category</span>
                <span>Unit</span>
                <span>Description</span>
            </div>

            {loading ? (
                <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                    Loading stat types...
                </div>
            ) : statTypes.length > 0 ? (
                statTypes.map((statType) => (
                    <div
                        key={statType.stat_type_id ?? statType.key}
                        className="grid grid-cols-[1fr_1fr_90px_90px_2fr] gap-3 items-center px-3 py-2 border-b border-white/6 last:border-b-0 text-[12px] hover:bg-white/3"
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

                        <span className="text-gray-500">
                            {statType.unit || "—"}
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
}

function LeaderboardReadOnlyPanel({
    statTypes,
    stats,
    leaderboard,
    activeStatKey,
    onStatKeyChange,
    loading,
}: {
    statTypes: StatType[];
    stats: PlayerSeasonStat[];
    leaderboard: LeaderboardRow[];
    activeStatKey: string;
    onStatKeyChange: (key: string) => void;
    loading: boolean;
}) {
    const availableLeaderboardStatTypes = statTypes.filter((statType) =>
        stats.some((stat) => stat.stat_type_key === statType.key)
    );

    const resolvedStatKey =
        availableLeaderboardStatTypes.some((statType) => statType.key === activeStatKey)
            ? activeStatKey
            : availableLeaderboardStatTypes[0]?.key ?? "";

    const selectedStatType = availableLeaderboardStatTypes.find(
        (statType) => statType.key === resolvedStatKey
    );

    const dynamicLeaderboard = buildLeaderboardRows(stats, resolvedStatKey);
    const rows = dynamicLeaderboard.length > 0 ? dynamicLeaderboard : leaderboard;

    const maxLeaderboardValue = Math.max(
        ...rows.map((row) => getStatValue(row)),
        1
    );

    return (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
                <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                    {selectedStatType?.name || "Stat leaderboard"}
                </span>

                <select
                    value={resolvedStatKey}
                    onChange={(event) => onStatKeyChange(event.target.value)}
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

            {loading ? (
                <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                    Loading leaderboard...
                </div>
            ) : rows.length > 0 ? (
                <ul>
                    {rows.map((row, index) => {
                        const name = getLeaderboardName(row);
                        const pos = row.position || "—";
                        const val = getStatValue(row);
                        const barPct = Math.round((val / maxLeaderboardValue) * 100);

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

                                <span className="flex-1 text-white truncate">{name}</span>
                                <span className="text-[10px] text-gray-500 w-6">{pos}</span>

                                <div className="w-24 h-[3px] bg-white/8 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#c49a22] rounded-full"
                                        style={{ width: `${barPct}%` }}
                                    />
                                </div>

                                <span className="text-[12px] font-medium text-white w-12 text-right">
                                    {val.toLocaleString()}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                    No leaderboard data available.
                </div>
            )}
        </div>
    );
}

function TeamRosterPanel({
    seasons,
    teams,
    players,
    rosters,
    selectedSeasonYear,
    selectedTeamId,
    selectedTeamSeason,
    loading,
    onSeasonChange,
    onTeamChange,
    onAddRoster,
    onDeleteRoster,
}: {
    seasons: Season[];
    teams: Team[];
    players: Player[];
    rosters: PlayerSeasonRoster[];
    selectedSeasonYear: string;
    selectedTeamId: string;
    selectedTeamSeason?: TeamSeason;
    loading: boolean;
    onSeasonChange: (year: string) => void;
    onTeamChange: (teamId: string) => void;
    onAddRoster: () => void;
    onDeleteRoster: (roster: PlayerSeasonRoster) => void;
}) {
    return (
        <div className="flex flex-col gap-3">
            <div className="bg-[#1a1a1a] border border-white/8 rounded-lg p-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[13px] font-medium text-white">
                            Team roster assignments
                        </p>
                        <p className="text-[11px] text-gray-500">
                            Select a season and team to manage player roster assignments.
                        </p>
                    </div>

                    <button
                        onClick={onAddRoster}
                        disabled={!selectedTeamSeason || players.length === 0}
                        className="text-[10px] px-2.5 py-1 rounded border border-white/10 text-gray-300 hover:text-white hover:border-white/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer bg-transparent"
                    >
                        Add player
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">
                            Season
                        </span>
                        <select
                            value={selectedSeasonYear}
                            onChange={(event) => onSeasonChange(event.target.value)}
                            className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                        >
                            <option value="">Select season</option>
                            {seasons.map((season) => (
                                <option
                                    key={season.season_id ?? season.id ?? season.year}
                                    value={String(season.year)}
                                >
                                    {season.year}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">
                            Team
                        </span>
                        <select
                            value={selectedTeamId}
                            onChange={(event) => onTeamChange(event.target.value)}
                            className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                        >
                            <option value="">Select team</option>
                            {teams.map((team) => {
                                const teamId = getTeamId(team);

                                if (teamId === undefined) {
                                    return null;
                                }

                                return (
                                    <option key={teamId} value={String(teamId)}>
                                        {getTeamDisplayName(team)}
                                    </option>
                                );
                            })}
                        </select>
                    </label>
                </div>

                {!selectedTeamSeason && selectedSeasonYear && selectedTeamId && (
                    <p className="text-[11px] text-red-400 mt-2">
                        This team is not assigned to the selected season yet.
                    </p>
                )}
            </div>

            <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 px-3 py-2 border-b border-white/8 text-[10px] uppercase tracking-widest text-gray-500">
                    <span>Player</span>
                    <span>Position</span>
                    <span>Jersey</span>
                    <span>Status</span>
                    <span>Actions</span>
                </div>

                {loading ? (
                    <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                        Loading roster...
                    </div>
                ) : rosters.length > 0 ? (
                    rosters.map((roster) => (
                        <div
                            key={roster.roster_id}
                            className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 items-center px-3 py-2 border-b border-white/6 last:border-b-0 hover:bg-white/3 transition-colors text-[12px]"
                        >
                            <span className="text-white font-medium truncate">
                                {roster.player_name || `Player #${roster.player}`}
                            </span>

                            <span className="text-gray-400">
                                {roster.player_position || "—"}
                            </span>

                            <span className="text-gray-400">
                                {roster.jersey_number ?? "—"}
                            </span>

                            <span
                                className={
                                    roster.is_active
                                        ? "text-emerald-400"
                                        : "text-gray-500"
                                }
                            >
                                {roster.roster_status ||
                                    (roster.is_active ? "Active" : "Inactive")}
                            </span>

                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => onDeleteRoster(roster)}
                                    className="text-[10px] px-2 py-0.5 rounded border border-red-900/50 text-red-500 hover:border-red-700 hover:text-red-300 transition-colors cursor-pointer bg-transparent"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                        No players assigned to this team-season roster.
                    </div>
                )}
            </div>
        </div>
    );
}

function EditPlayerModal({
    player,
    teams,
    formData,
    onChange,
    onClose,
    onSave,
    saving,
}: {
    player: Player;
    teams: Team[];
    formData: PlayerFormData;
    onChange: (field: keyof PlayerFormData, value: string | boolean) => void;
    onClose: () => void;
    onSave: () => void;
    saving: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-lg bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl">
                <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-sm font-medium text-white">
                        Edit {displayPlayerName(player)}
                    </p>
                    <p className="text-[11px] text-gray-500">
                        Update player identity, position, team, and active status.
                    </p>
                </div>

                <div className="p-4 grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">
                            First name
                        </span>
                        <input
                            value={formData.first_name}
                            onChange={(event) => onChange("first_name", event.target.value)}
                            className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                        />
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">
                            Last name
                        </span>
                        <input
                            value={formData.last_name}
                            onChange={(event) => onChange("last_name", event.target.value)}
                            className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                        />
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">
                            Position
                        </span>
                        <input
                            value={formData.position}
                            onChange={(event) => onChange("position", event.target.value)}
                            className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                            placeholder="QB, RB, WR, LB, DT..."
                        />
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">
                            Current team
                        </span>
                        <select
                            value={formData.team}
                            onChange={(event) => onChange("team", event.target.value)}
                            className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                        >
                            <option value="">Select team</option>
                            {teams.map((team) => {
                                const teamId = getTeamId(team);

                                if (teamId === undefined) {
                                    return null;
                                }

                                return (
                                    <option key={teamId} value={String(teamId)}>
                                        {getTeamDisplayName(team)}
                                    </option>
                                );
                            })}
                        </select>
                    </label>

                    <label className="col-span-2 flex items-center gap-2 text-[12px] text-gray-300">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(event) => onChange("is_active", event.target.checked)}
                        />
                        Active player
                    </label>
                </div>

                <div className="px-4 py-3 border-t border-white/8 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-3 py-1.5 rounded border border-white/10 text-gray-300 text-xs hover:text-white hover:border-white/30 disabled:opacity-50 bg-transparent"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="px-3 py-1.5 rounded border border-emerald-800 bg-emerald-900/40 text-emerald-300 text-xs hover:bg-emerald-800/60 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DeletePlayerModal({
    player,
    onClose,
    onConfirm,
    deleting,
}: {
    player: Player;
    onClose: () => void;
    onConfirm: () => void;
    deleting: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md bg-[#1a1a1a] border border-red-900/50 rounded-lg shadow-xl">
                <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-sm font-medium text-white">Delete player?</p>
                    <p className="text-[12px] text-gray-400 mt-1">
                        Are you sure you want to delete{" "}
                        <span className="text-red-300 font-medium">
                            {displayPlayerName(player)}
                        </span>
                        ? This may also affect roster and stat records connected to this player.
                    </p>
                </div>

                <div className="px-4 py-3 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={deleting}
                        className="px-3 py-1.5 rounded border border-white/10 text-gray-300 text-xs hover:text-white hover:border-white/30 disabled:opacity-50 bg-transparent"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="px-3 py-1.5 rounded border border-red-800 bg-red-900/40 text-red-300 text-xs hover:bg-red-800/60 disabled:opacity-50"
                    >
                        {deleting ? "Deleting..." : "Delete player"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditTeamModal({
    team,
    formData,
    onChange,
    onClose,
    onSave,
    saving,
}: {
    team: Team;
    formData: TeamFormData;
    onChange: (field: keyof TeamFormData, value: string) => void;
    onClose: () => void;
    onSave: () => void;
    saving: boolean;
}) {
    const fields: { field: keyof TeamFormData; label: string; type?: string }[] = [
        { field: "city", label: "City" },
        { field: "state", label: "State" },
        { field: "team_name", label: "Team name" },
        { field: "abbreviation", label: "Abbreviation" },
        { field: "conference", label: "Conference" },
        { field: "division", label: "Division" },
        { field: "primary_color", label: "Primary color", type: "color" },
        { field: "secondary_color", label: "Secondary color", type: "color" },
        { field: "text_color", label: "Text color", type: "color" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-lg bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl">
                <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-sm font-medium text-white">
                        Edit {getTeamDisplayName(team)}
                    </p>
                    <p className="text-[11px] text-gray-500">
                        Update team identity, division, and dashboard theme colors.
                    </p>
                </div>

                <div className="p-4 grid grid-cols-2 gap-3">
                    {fields.map(({ field, label, type }) => (
                        <label key={field} className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                {label}
                            </span>

                            <div className="flex items-center gap-2">
                                <input
                                    type={type ?? "text"}
                                    value={type === "color" ? safeColorValue(formData[field]) : formData[field]}
                                    onChange={(event) => onChange(field, event.target.value)}
                                    className={
                                        type === "color"
                                            ? "h-8 w-10 rounded border border-white/10 bg-[#111] cursor-pointer"
                                            : "w-full bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                                    }
                                />

                                {type === "color" && (
                                    <input
                                        value={formData[field]}
                                        onChange={(event) => onChange(field, event.target.value)}
                                        className="flex-1 bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                                    />
                                )}
                            </div>
                        </label>
                    ))}
                </div>

                <div className="px-4 py-3 border-t border-white/8 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-3 py-1.5 rounded border border-white/10 text-gray-300 text-xs hover:text-white hover:border-white/30 disabled:opacity-50 bg-transparent"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="px-3 py-1.5 rounded border border-emerald-800 bg-emerald-900/40 text-emerald-300 text-xs hover:bg-emerald-800/60 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DeleteTeamModal({
    team,
    onClose,
    onConfirm,
    deleting,
}: {
    team: Team;
    onClose: () => void;
    onConfirm: () => void;
    deleting: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md bg-[#1a1a1a] border border-red-900/50 rounded-lg shadow-xl">
                <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-sm font-medium text-white">Delete team?</p>
                    <p className="text-[12px] text-gray-400 mt-1">
                        Are you sure you want to delete{" "}
                        <span className="text-red-300 font-medium">
                            {getTeamDisplayName(team)}
                        </span>
                        ? This action cannot be undone.
                    </p>
                </div>

                <div className="px-4 py-3 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={deleting}
                        className="px-3 py-1.5 rounded border border-white/10 text-gray-300 text-xs hover:text-white hover:border-white/30 disabled:opacity-50 bg-transparent"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="px-3 py-1.5 rounded border border-red-800 bg-red-900/40 text-red-300 text-xs hover:bg-red-800/60 disabled:opacity-50"
                    >
                        {deleting ? "Deleting..." : "Delete team"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function SeasonModal({
    mode,
    formData,
    onChange,
    onClose,
    onSave,
    saving,
}: {
    mode: "create" | "edit";
    formData: SeasonFormData;
    onChange: (value: string) => void;
    onClose: () => void;
    onSave: () => void;
    saving: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl">
                <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-sm font-medium text-white">
                        {mode === "create" ? "Add season" : "Edit season"}
                    </p>
                    <p className="text-[11px] text-gray-500">
                        Enter the season year used by dashboard filters and reports.
                    </p>
                </div>

                <div className="p-4">
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">
                            Year
                        </span>
                        <input
                            type="number"
                            min="1920"
                            max="2030"
                            value={formData.year}
                            onChange={(event) => onChange(event.target.value)}
                            className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                            placeholder="example: 2024"
                        />
                    </label>
                </div>

                <div className="px-4 py-3 border-t border-white/8 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-3 py-1.5 rounded border border-white/10 text-gray-300 text-xs hover:text-white hover:border-white/30 disabled:opacity-50 bg-transparent"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="px-3 py-1.5 rounded border border-emerald-800 bg-emerald-900/40 text-emerald-300 text-xs hover:bg-emerald-800/60 disabled:opacity-50"
                    >
                        {saving
                            ? "Saving..."
                            : mode === "create"
                                ? "Create season"
                                : "Save changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DeleteSeasonModal({
    season,
    onClose,
    onConfirm,
    deleting,
}: {
    season: Season;
    onClose: () => void;
    onConfirm: () => void;
    deleting: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md bg-[#1a1a1a] border border-red-900/50 rounded-lg shadow-xl">
                <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-sm font-medium text-white">Delete season?</p>
                    <p className="text-[12px] text-gray-400 mt-1">
                        Are you sure you want to delete{" "}
                        <span className="text-red-300 font-medium">
                            Season {season.year ?? "unknown"}
                        </span>
                        ? This action cannot be undone.
                    </p>
                </div>

                <div className="px-4 py-3 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={deleting}
                        className="px-3 py-1.5 rounded border border-white/10 text-gray-300 text-xs hover:text-white hover:border-white/30 disabled:opacity-50 bg-transparent"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="px-3 py-1.5 rounded border border-red-800 bg-red-900/40 text-red-300 text-xs hover:bg-red-800/60 disabled:opacity-50"
                    >
                        {deleting ? "Deleting..." : "Delete season"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function RosterModal({
    players,
    existingRosters,
    formData,
    onChange,
    onClose,
    onSave,
    saving,
}: {
    players: Player[];
    existingRosters: PlayerSeasonRoster[];
    formData: RosterFormData;
    onChange: (field: keyof RosterFormData, value: string | boolean) => void;
    onClose: () => void;
    onSave: () => void;
    saving: boolean;
}) {
    const assignedPlayerIds = new Set(
        existingRosters.map((roster) => String(roster.player))
    );

    const availablePlayers = players.filter((player) => {
        const playerId = getStablePlayerId(player);

        if (playerId === undefined) {
            return false;
        }

        return !assignedPlayerIds.has(String(playerId));
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl">
                <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-sm font-medium text-white">
                        Add player to roster
                    </p>
                    <p className="text-[11px] text-gray-500">
                        Assign an existing player to the selected team-season.
                    </p>
                </div>

                <div className="p-4 grid gap-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">
                            Player
                        </span>
                        <select
                            value={formData.player}
                            onChange={(event) =>
                                onChange("player", event.target.value)
                            }
                            className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                        >
                            <option value="">Select player</option>
                            {availablePlayers.map((player) => {
                                const playerId = getStablePlayerId(player);

                                if (playerId === undefined) {
                                    return null;
                                }

                                return (
                                    <option key={playerId} value={String(playerId)}>
                                        {displayPlayerName(player)}
                                        {player.position ? ` (${player.position})` : ""}
                                    </option>
                                );
                            })}
                        </select>

                        {availablePlayers.length === 0 && (
                            <span className="text-[11px] text-gray-500">
                                No available players. Create more players or remove an existing roster assignment first.
                            </span>
                        )}
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">
                            Jersey number
                        </span>
                        <input
                            type="number"
                            value={formData.jersey_number}
                            onChange={(event) =>
                                onChange("jersey_number", event.target.value)
                            }
                            className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                            placeholder="example: 10"
                        />
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">
                            Roster status
                        </span>
                        <select
                            value={formData.roster_status}
                            onChange={(event) =>
                                onChange("roster_status", event.target.value)
                            }
                            className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Practice Squad">Practice Squad</option>
                            <option value="Injured Reserve">Injured Reserve</option>
                        </select>
                    </label>

                    <label className="flex items-center gap-2 text-[12px] text-gray-300">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(event) =>
                                onChange("is_active", event.target.checked)
                            }
                        />
                        Active roster assignment
                    </label>
                </div>

                <div className="px-4 py-3 border-t border-white/8 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-3 py-1.5 rounded border border-white/10 text-gray-300 text-xs hover:text-white hover:border-white/30 disabled:opacity-50 bg-transparent"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onSave}
                        disabled={saving || availablePlayers.length === 0}
                        className="px-3 py-1.5 rounded border border-emerald-800 bg-emerald-900/40 text-emerald-300 text-xs hover:bg-emerald-800/60 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Add player"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DeleteRosterModal({
    roster,
    onClose,
    onConfirm,
    deleting,
}: {
    roster: PlayerSeasonRoster;
    onClose: () => void;
    onConfirm: () => void;
    deleting: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md bg-[#1a1a1a] border border-red-900/50 rounded-lg shadow-xl">
                <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-sm font-medium text-white">Remove player?</p>
                    <p className="text-[12px] text-gray-400 mt-1">
                        Remove{" "}
                        <span className="text-red-300 font-medium">
                            {roster.player_name || `Player #${roster.player}`}
                        </span>{" "}
                        from this team-season roster?
                    </p>
                </div>

                <div className="px-4 py-3 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={deleting}
                        className="px-3 py-1.5 rounded border border-white/10 text-gray-300 text-xs hover:text-white hover:border-white/30 disabled:opacity-50 bg-transparent"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="px-3 py-1.5 rounded border border-red-800 bg-red-900/40 text-red-300 text-xs hover:bg-red-800/60 disabled:opacity-50"
                    >
                        {deleting ? "Removing..." : "Remove player"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Page component
export default function AdminPage() {
    const router = useRouter();

    const [authChecked, setAuthChecked] = useState(false);
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");
    const [activeSection, setActiveSection] = useState("dashboard");

    // Toast notifications
    const [showError, setShowError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const [teams, setTeams] = useState<Team[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);

    // Player modals
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [playerFormData, setPlayerFormData] = useState<PlayerFormData | null>(null);
    const [playerPendingDelete, setPlayerPendingDelete] = useState<Player | null>(null);
    const [savingPlayer, setSavingPlayer] = useState(false);
    const [deletingPlayer, setDeletingPlayer] = useState(false);
    const [playerOverrides, setPlayerOverrides] = useState<Player[] | null>(null);

    // Team modals
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [teamFormData, setTeamFormData] = useState<TeamFormData | null>(null);
    const [teamPendingDelete, setTeamPendingDelete] = useState<Team | null>(null);
    const [savingTeam, setSavingTeam] = useState(false);
    const [deletingTeam, setDeletingTeam] = useState(false);

    // Season modals
    const [editingSeason, setEditingSeason] = useState<Season | null>(null);
    const [seasonFormData, setSeasonFormData] = useState<SeasonFormData | null>(null);
    const [seasonPendingDelete, setSeasonPendingDelete] = useState<Season | null>(null);
    const [savingSeason, setSavingSeason] = useState(false);
    const [deletingSeason, setDeletingSeason] = useState(false);
    const [creatingSeason, setCreatingSeason] = useState(false);

    // Team roster state
    const [teamSeasons, setTeamSeasons] = useState<TeamSeason[]>([]);
    const [rosters, setRosters] = useState<PlayerSeasonRoster[]>([]);

    const [selectedRosterSeasonYear, setSelectedRosterSeasonYear] = useState("");
    const [selectedRosterTeamId, setSelectedRosterTeamId] = useState("");

    const [rosterFormData, setRosterFormData] = useState<RosterFormData | null>(null);
    const [rosterPendingDelete, setRosterPendingDelete] =
        useState<PlayerSeasonRoster | null>(null);

    const [loadingRosters, setLoadingRosters] = useState(false);
    const [savingRoster, setSavingRoster] = useState(false);
    const [deletingRoster, setDeletingRoster] = useState(false);

    // Read-only dashboard parity state
    const [selectedDashboardSeasonYear, setSelectedDashboardSeasonYear] = useState("");
    const [selectedDashboardTeamId, setSelectedDashboardTeamId] = useState("");
    const [dashboardPlayers, setDashboardPlayers] = useState<Player[]>([]);
    const [dashboardStats, setDashboardStats] = useState<PlayerSeasonStat[]>([]);
    const [statTypes, setStatTypes] = useState<StatType[]>([]);
    const [coachAssignments, setCoachAssignments] = useState<CoachSeasonAssignment[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
    const [activeLeaderboardStatKey, setActiveLeaderboardStatKey] =
        useState("receiving_yards");
    const [loadingDashboardReports, setLoadingDashboardReports] = useState(false);

    // SQL comparison state
    const [leftComparisonPlayerId, setLeftComparisonPlayerId] = useState("");
    const [rightComparisonPlayerId, setRightComparisonPlayerId] = useState("");
    const [comparisonReport, setComparisonReport] =
        useState<PlayerComparisonReport | null>(null);
    const [comparisonError, setComparisonError] = useState("");
    const [loadingComparisonData, setLoadingComparisonData] = useState(false);

    const fetchPlayers = useCallback(() => playerAPI.getAllPlayers(), []);
    const {
        data: playersResponse,
        loading,
        error: apiError,
    } = useApiData(fetchPlayers);

    const basePlayerList = useMemo(
        () => normalizeApiList<Player>(playersResponse ?? []),
        [playersResponse]
    );

    const playerList = playerOverrides ?? basePlayerList;

    const selectedDashboardTeam = useMemo(() => {
        return teams.find((team) => String(getTeamId(team)) === selectedDashboardTeamId);
    }, [teams, selectedDashboardTeamId]);

    const dashboardTeamLabel = selectedDashboardTeam
        ? `${selectedDashboardTeam.abbreviation || getTeamDisplayName(selectedDashboardTeam)}${
            selectedDashboardSeasonYear ? ` · ${selectedDashboardSeasonYear}` : ""
        }`
        : selectedDashboardSeasonYear
            ? `Team · ${selectedDashboardSeasonYear}`
            : "Team";

    const comparisonPlayerIds = useMemo(() => {
        return dashboardPlayers
            .map((player) => String(player.player_id ?? player.id ?? ""))
            .filter(Boolean);
    }, [dashboardPlayers]);

    const selectedTeamSeason = useMemo(() => {
        return teamSeasons.find((item) => {
            return (
                String(item.team) === selectedRosterTeamId &&
                String(item.season_year) === selectedRosterSeasonYear
            );
        });
    }, [teamSeasons, selectedRosterTeamId, selectedRosterSeasonYear]);

    const fetchAdminReferenceData = useCallback(async () => {
        const [seasonData, teamData, teamSeasonData] = await Promise.all([
            safeApiCall<unknown[]>(() => seasonAPI.getAllSeasons(), []),
            safeApiCall<unknown[]>(() => teamAPI.getAllTeams(), []),
            safeApiCall<unknown[]>(() => seasonAPI.getTeamSeasons(), []),
        ]);

        const seasonList = normalizeApiList<Season>(seasonData)
            .filter((season) => season.year !== undefined && season.year !== null)
            .sort((a, b) => Number(b.year) - Number(a.year));

        const teamList = normalizeApiList<Team>(teamData)
            .filter((team) => team.team_id !== undefined || team.id !== undefined)
            .sort((a, b) => getTeamDisplayName(a).localeCompare(getTeamDisplayName(b)));

        const teamSeasonList = normalizeApiList<TeamSeason>(teamSeasonData)
            .filter((item) => item.team_season_id !== undefined)
            .sort((a, b) => {
                const yearCompare =
                    Number(b.season_year ?? 0) - Number(a.season_year ?? 0);

                if (yearCompare !== 0) {
                    return yearCompare;
                }

                return (a.team_display_name ?? "").localeCompare(
                    b.team_display_name ?? ""
                );
            });

        setSeasons(seasonList);
        setTeams(teamList);
        setTeamSeasons(teamSeasonList);
    }, []);

    const fetchDashboardReports = useCallback(async () => {
        if (!selectedDashboardSeasonYear || !selectedDashboardTeamId) {
            setDashboardPlayers([]);
            setDashboardStats([]);
            setCoachAssignments([]);
            setLeaderboard([]);
            return;
        }

        try {
            setLoadingDashboardReports(true);

            const sharedParams = {
                team: selectedDashboardTeamId,
                year: selectedDashboardSeasonYear,
            };

            const [
                filteredPlayers,
                statTypeData,
                playerSeasonStatData,
                coachAssignmentData,
            ] = await Promise.all([
                safeApiCall<unknown[]>(() => playerAPI.getAllPlayers(sharedParams), []),
                safeApiCall<unknown[]>(() => statAPI.getStatTypes(), []),
                safeApiCall<unknown[]>(
                    () => statAPI.getPlayerSeasonStats(sharedParams),
                    []
                ),
                safeApiCall<unknown[]>(
                    () => coachAPI.getCoachSeasonAssignments(sharedParams),
                    []
                ),
            ]);

            const normalizedPlayers = normalizeApiList<Player>(filteredPlayers);
            const normalizedStatTypes = normalizeApiList<StatType>(statTypeData);
            const normalizedStats =
                normalizeApiList<PlayerSeasonStat>(playerSeasonStatData);
            const normalizedCoaches =
                normalizeApiList<CoachSeasonAssignment>(coachAssignmentData);

            setDashboardPlayers(normalizedPlayers);
            setStatTypes(normalizedStatTypes);
            setDashboardStats(normalizedStats);
            setCoachAssignments(normalizedCoaches);
            setLeaderboard([]);
        } finally {
            setLoadingDashboardReports(false);
        }
    }, [selectedDashboardSeasonYear, selectedDashboardTeamId]);

    const fetchSelectedRoster = useCallback(async () => {
        if (!selectedRosterSeasonYear || !selectedRosterTeamId) {
            setRosters([]);
            return;
        }

        try {
            setLoadingRosters(true);

            const rosterData = await safeApiCall<unknown[]>(
                () =>
                    seasonAPI.getPlayerSeasonRosters({
                        team: selectedRosterTeamId,
                        year: selectedRosterSeasonYear,
                    }),
                []
            );

            const rosterList = normalizeApiList<PlayerSeasonRoster>(rosterData)
                .filter((roster) => roster.roster_id !== undefined)
                .sort((a, b) => {
                    const aName = a.player_name ?? "";
                    const bName = b.player_name ?? "";
                    return aName.localeCompare(bName);
                });

            setRosters(rosterList);
        } finally {
            setLoadingRosters(false);
        }
    }, [selectedRosterSeasonYear, selectedRosterTeamId]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUsername = localStorage.getItem("username");
        const storedRole = localStorage.getItem("role");

        if (!token || storedRole !== "admin") {
            router.push("/login");
            return;
        }

        setUsername(storedUsername || "Admin");
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

    useEffect(() => {
        if (!authChecked) {
            return;
        }

        fetchAdminReferenceData();
    }, [authChecked, fetchAdminReferenceData]);

    useEffect(() => {
        if (!selectedRosterSeasonYear && seasons.length > 0) {
            setSelectedRosterSeasonYear(String(seasons[0].year));
        }

        if (!selectedDashboardSeasonYear && seasons.length > 0) {
            setSelectedDashboardSeasonYear(String(seasons[0].year));
        }
    }, [seasons, selectedRosterSeasonYear, selectedDashboardSeasonYear]);

    useEffect(() => {
        if (!selectedRosterTeamId && teams.length > 0) {
            const preferredTeam =
                teams.find((team) => team.abbreviation === "GB") ?? teams[0];
            const firstTeamId = getTeamId(preferredTeam);

            if (firstTeamId !== undefined) {
                setSelectedRosterTeamId(String(firstTeamId));
            }
        }

        if (!selectedDashboardTeamId && teams.length > 0) {
            const preferredTeam =
                teams.find((team) => team.abbreviation === "GB") ?? teams[0];
            const firstTeamId = getTeamId(preferredTeam);

            if (firstTeamId !== undefined) {
                setSelectedDashboardTeamId(String(firstTeamId));
            }
        }
    }, [teams, selectedRosterTeamId, selectedDashboardTeamId]);

    useEffect(() => {
        if (!authChecked) {
            return;
        }

        fetchSelectedRoster();
    }, [authChecked, fetchSelectedRoster]);

    useEffect(() => {
        if (!authChecked) {
            return;
        }

        fetchDashboardReports();
    }, [authChecked, fetchDashboardReports]);

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
                !selectedDashboardTeamId ||
                !selectedDashboardSeasonYear ||
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
                    team: selectedDashboardTeamId,
                    year: selectedDashboardSeasonYear,
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
        selectedDashboardTeamId,
        selectedDashboardSeasonYear,
        leftComparisonPlayerId,
        rightComparisonPlayerId,
    ]);

    useEffect(() => {
        if (apiError) {
            setErrorMsg(String(apiError));
            setShowError(true);

            const timeout = setTimeout(() => setShowError(false), 5000);
            return () => clearTimeout(timeout);
        }
    }, [apiError]);

    const showTemporaryError = useCallback((message: string) => {
        setErrorMsg(message);
        setShowError(true);

        const timeout = setTimeout(() => setShowError(false), 5000);
        return () => clearTimeout(timeout);
    }, []);

    const showTemporarySuccess = useCallback((message: string) => {
        setSuccessMsg(message);
        setShowSuccess(true);

        const timeout = setTimeout(() => setShowSuccess(false), 5000);
        return () => clearTimeout(timeout);
    }, []);

    // Handlers
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

    // Player handlers
    const handleEditPlayer = (player: Player) => {
        setEditingPlayer(player);
        setPlayerFormData(playerToFormData(player));
    };

    const handlePlayerFormChange = (
        field: keyof PlayerFormData,
        value: string | boolean
    ) => {
        setPlayerFormData((current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                [field]: value,
            };
        });
    };

    const handleSavePlayer = async () => {
        if (!editingPlayer || !playerFormData) {
            return;
        }

        const playerId = getStablePlayerId(editingPlayer);

        if (playerId === undefined) {
            showTemporaryError("Unable to update player because the player ID is missing");
            return;
        }

        if (!playerFormData.first_name.trim() || !playerFormData.last_name.trim()) {
            showTemporaryError("Player first name and last name are required");
            return;
        }

        if (!playerFormData.position.trim()) {
            showTemporaryError("Player position is required");
            return;
        }

        if (!playerFormData.team) {
            showTemporaryError("Player team is required");
            return;
        }

        const payload = {
            first_name: playerFormData.first_name.trim(),
            last_name: playerFormData.last_name.trim(),
            position: playerFormData.position.trim(),
            team: Number(playerFormData.team),
            is_active: playerFormData.is_active,
        };

        try {
            setSavingPlayer(true);

            await playerAPI.updatePlayer(playerId, payload);

            const updatedPlayer: Player = {
                ...editingPlayer,
                ...payload,
            };

            setPlayerOverrides((current) => {
                const source = current ?? playerList;

                return source.map((player) => {
                    const currentPlayerId = getStablePlayerId(player);

                    return String(currentPlayerId) === String(playerId)
                        ? updatedPlayer
                        : player;
                });
            });

            setEditingPlayer(null);
            setPlayerFormData(null);

            await fetchDashboardReports();

            showTemporarySuccess(`${displayPlayerName(updatedPlayer)} updated successfully`);
        } catch (error) {
            console.error("Update player error:", error);
            showTemporaryError("Failed to update player");
        } finally {
            setSavingPlayer(false);
        }
    };

    const handleDeletePlayer = (player: Player) => {
        setPlayerPendingDelete(player);
    };

    const handleConfirmDeletePlayer = async () => {
        if (!playerPendingDelete) {
            return;
        }

        const playerId = getStablePlayerId(playerPendingDelete);

        if (playerId === undefined) {
            showTemporaryError("Unable to delete player because the player ID is missing");
            return;
        }

        try {
            setDeletingPlayer(true);

            const playerName = displayPlayerName(playerPendingDelete);

            await playerAPI.deletePlayer(playerId);

            setPlayerOverrides((current) => {
                const source = current ?? playerList;

                return source.filter((player) => {
                    const currentPlayerId = getStablePlayerId(player);
                    return String(currentPlayerId) !== String(playerId);
                });
            });

            setPlayerPendingDelete(null);

            await fetchSelectedRoster();
            await fetchDashboardReports();

            showTemporarySuccess(`${playerName} deleted successfully`);
        } catch (error) {
            console.error("Delete player error:", error);
            showTemporaryError(
                "Failed to delete player. They may still be connected to roster or stat records."
            );
        } finally {
            setDeletingPlayer(false);
        }
    };

    // Team handlers
    const handleEditTeam = (team: Team) => {
        setEditingTeam(team);
        setTeamFormData(teamToFormData(team));
    };

    const handleTeamFormChange = (field: keyof TeamFormData, value: string) => {
        setTeamFormData((current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                [field]: value,
            };
        });
    };

    const handleSaveTeam = async () => {
        if (!editingTeam || !teamFormData) {
            return;
        }

        const colorFields: (keyof TeamFormData)[] = [
            "primary_color",
            "secondary_color",
            "text_color",
        ];

        const invalidColorField = colorFields.find(
            (field) => !isValidHexColor(teamFormData[field])
        );

        if (invalidColorField) {
            showTemporaryError("Team colors must use a valid hex format like #203731");
            return;
        }

        const teamId = getTeamId(editingTeam);

        if (teamId === undefined) {
            showTemporaryError("Unable to update team because the team ID is missing");
            return;
        }

        try {
            setSavingTeam(true);

            const teamName = getTeamDisplayName(editingTeam);

            await teamAPI.updateTeam(teamId, teamFormData);

            setEditingTeam(null);
            setTeamFormData(null);

            await fetchAdminReferenceData();

            showTemporarySuccess(`${teamName} updated successfully`);
        } catch (error) {
            console.error("Update team error:", error);
            showTemporaryError("Failed to update team");
        } finally {
            setSavingTeam(false);
        }
    };

    const handleDeleteTeam = (team: Team) => {
        setTeamPendingDelete(team);
    };

    const handleConfirmDeleteTeam = async () => {
        if (!teamPendingDelete) {
            return;
        }

        const teamId = getTeamId(teamPendingDelete);

        if (teamId === undefined) {
            showTemporaryError("Unable to delete team because the team ID is missing");
            return;
        }

        try {
            setDeletingTeam(true);

            const teamName = getTeamDisplayName(teamPendingDelete);

            await teamAPI.deleteTeam(teamId);

            setTeamPendingDelete(null);

            await fetchAdminReferenceData();

            showTemporarySuccess(`${teamName} deleted successfully`);
        } catch (error) {
            console.error("Delete team error:", error);
            showTemporaryError(
                "Failed to delete team. It may still be connected to players or coaches."
            );
        } finally {
            setDeletingTeam(false);
        }
    };

    // Season handlers
    const handleAddSeason = () => {
        setEditingSeason(null);
        setSeasonFormData({ year: "" });
    };

    const handleEditSeason = (season: Season) => {
        setEditingSeason(season);
        setSeasonFormData(seasonToFormData(season));
    };

    const handleSeasonFormChange = (value: string) => {
        setSeasonFormData({ year: value });
    };

    const handleSaveSeason = async () => {
        if (!seasonFormData) {
            return;
        }

        if (!isValidSeasonYear(seasonFormData.year)) {
            showTemporaryError("Season year must be a valid year between 1920 and 2030");
            return;
        }

        const payload = {
            year: Number(seasonFormData.year),
        };

        try {
            if (editingSeason) {
                const seasonId = getSeasonId(editingSeason);

                if (seasonId === undefined) {
                    showTemporaryError("Unable to update season because the season ID is missing");
                    return;
                }

                setSavingSeason(true);
                await seasonAPI.updateSeason(seasonId, payload);
                showTemporarySuccess(`Season ${payload.year} updated successfully`);
            } else {
                setCreatingSeason(true);
                await seasonAPI.createSeason(payload);
                showTemporarySuccess(`Season ${payload.year} created successfully`);
            }

            setEditingSeason(null);
            setSeasonFormData(null);

            await fetchAdminReferenceData();
        } catch (error) {
            console.error("Save season error:", error);
            showTemporaryError(
                editingSeason
                    ? "Failed to update season"
                    : "Failed to create season"
            );
        } finally {
            setSavingSeason(false);
            setCreatingSeason(false);
        }
    };

    const handleDeleteSeason = (season: Season) => {
        setSeasonPendingDelete(season);
    };

    const handleConfirmDeleteSeason = async () => {
        if (!seasonPendingDelete) {
            return;
        }

        const seasonId = getSeasonId(seasonPendingDelete);

        if (seasonId === undefined) {
            showTemporaryError("Unable to delete season because the season ID is missing");
            return;
        }

        try {
            setDeletingSeason(true);

            const seasonYear = seasonPendingDelete.year ?? "selected season";

            await seasonAPI.deleteSeason(seasonId);

            setSeasonPendingDelete(null);

            await fetchAdminReferenceData();

            showTemporarySuccess(`Season ${seasonYear} deleted successfully`);
        } catch (error) {
            console.error("Delete season error:", error);
            showTemporaryError(
                "Failed to delete season. It may still be connected to player stats or roster records."
            );
        } finally {
            setDeletingSeason(false);
        }
    };

    // Roster handlers
    const handleOpenAddRoster = () => {
        if (!selectedTeamSeason) {
            showTemporaryError("Select a valid season and team before adding a player");
            return;
        }

        setRosterFormData({
            player: "",
            jersey_number: "",
            roster_status: "Active",
            is_active: true,
        });
    };

    const handleRosterFormChange = (
        field: keyof RosterFormData,
        value: string | boolean
    ) => {
        setRosterFormData((current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                [field]: value,
            };
        });
    };

    const handleSaveRoster = async () => {
        if (!rosterFormData) {
            return;
        }

        if (!selectedTeamSeason) {
            showTemporaryError("Selected team-season does not exist");
            return;
        }

        if (!rosterFormData.player) {
            showTemporaryError("Select a player before saving the roster assignment");
            return;
        }

        const payload = {
            player: Number(rosterFormData.player),
            team_season: selectedTeamSeason.team_season_id,
            jersey_number: rosterFormData.jersey_number
                ? Number(rosterFormData.jersey_number)
                : null,
            roster_status: rosterFormData.roster_status,
            is_active: rosterFormData.is_active,
        };

        try {
            setSavingRoster(true);

            await seasonAPI.createPlayerSeasonRoster(payload);

            setRosterFormData(null);

            await fetchSelectedRoster();
            await fetchDashboardReports();

            showTemporarySuccess("Player assigned to roster successfully");
        } catch (error) {
            console.error("Create roster error:", error);
            showTemporaryError(
                "Failed to assign player. They may already be on this team-season roster."
            );
        } finally {
            setSavingRoster(false);
        }
    };

    const handleDeleteRoster = (roster: PlayerSeasonRoster) => {
        setRosterPendingDelete(roster);
    };

    const handleConfirmDeleteRoster = async () => {
        if (!rosterPendingDelete) {
            return;
        }

        try {
            setDeletingRoster(true);

            await seasonAPI.deletePlayerSeasonRoster(rosterPendingDelete.roster_id);

            setRosterPendingDelete(null);

            await fetchSelectedRoster();
            await fetchDashboardReports();

            showTemporarySuccess("Player removed from roster successfully");
        } catch (error) {
            console.error("Delete roster error:", error);
            showTemporaryError("Failed to remove player from roster");
        } finally {
            setDeletingRoster(false);
        }
    };

    const renderReportFilter = () => (
        <AdminDataFilterPanel
            seasons={seasons}
            teams={teams}
            selectedSeasonYear={selectedDashboardSeasonYear}
            selectedTeamId={selectedDashboardTeamId}
            onSeasonChange={(year) => {
                setSelectedDashboardSeasonYear(year);
                setComparisonReport(null);
                setComparisonError("");
            }}
            onTeamChange={(teamId) => {
                setSelectedDashboardTeamId(teamId);
                setComparisonReport(null);
                setComparisonError("");
                setLeftComparisonPlayerId("");
                setRightComparisonPlayerId("");
            }}
        />
    );

    const renderAdminContent = () => {
        switch (activeSection) {
            case "dashboard":
                return (
                    <AdminOverview
                        players={playerList}
                        teams={teams}
                        seasons={seasons}
                        onSectionChange={setActiveSection}
                        onEditPlayer={handleEditPlayer}
                        onDeletePlayer={handleDeletePlayer}
                    />
                );

            case "players":
                return (
                    <AdminPlayerRecords
                        players={playerList}
                        teams={teams}
                        onEdit={handleEditPlayer}
                        onDelete={handleDeletePlayer}
                        title="Player records"
                        description="Search, filter, group, edit, or delete all player records."
                        pageSize={25}
                    />
                );

            case "manage-seasons":
                return (
                    <SeasonsPanel
                        seasons={seasons}
                        onAdd={handleAddSeason}
                        onEdit={handleEditSeason}
                        onDelete={handleDeleteSeason}
                    />
                );

            case "manage-teams":
                return (
                    <TeamsPanel
                        teams={teams}
                        onEdit={handleEditTeam}
                        onDelete={handleDeleteTeam}
                    />
                );

            case "season-summary":
                return (
                    <>
                        {renderReportFilter()}
                        <SeasonSummaryPanel
                            players={dashboardPlayers}
                            stats={dashboardStats}
                            coaches={coachAssignments}
                            teamLabel={dashboardTeamLabel}
                            selectedSeasonYear={selectedDashboardSeasonYear}
                        />
                    </>
                );

            case "coaches":
                return (
                    <>
                        {renderReportFilter()}
                        <CoachesReadOnlyPanel
                            assignments={coachAssignments}
                            teamLabel={dashboardTeamLabel}
                            loading={loadingDashboardReports}
                        />
                    </>
                );

            case "team-roster":
                return (
                    <TeamRosterPanel
                        seasons={seasons}
                        teams={teams}
                        players={playerList}
                        rosters={rosters}
                        selectedSeasonYear={selectedRosterSeasonYear}
                        selectedTeamId={selectedRosterTeamId}
                        selectedTeamSeason={selectedTeamSeason}
                        loading={loadingRosters}
                        onSeasonChange={setSelectedRosterSeasonYear}
                        onTeamChange={setSelectedRosterTeamId}
                        onAddRoster={handleOpenAddRoster}
                        onDeleteRoster={handleDeleteRoster}
                    />
                );

            case "player-stats":
                return (
                    <>
                        {renderReportFilter()}
                        <PlayerStatsReadOnlyPanel
                            players={dashboardPlayers}
                            stats={dashboardStats}
                            teamLabel={dashboardTeamLabel}
                            loading={loadingDashboardReports}
                        />
                    </>
                );

            case "stat-types":
                return (
                    <StatTypesReadOnlyPanel
                        statTypes={statTypes}
                        loading={loadingDashboardReports}
                    />
                );

            case "leaderboard":
                return (
                    <>
                        {renderReportFilter()}
                        <LeaderboardReadOnlyPanel
                            statTypes={statTypes}
                            stats={dashboardStats}
                            leaderboard={leaderboard}
                            activeStatKey={activeLeaderboardStatKey}
                            onStatKeyChange={setActiveLeaderboardStatKey}
                            loading={loadingDashboardReports}
                        />
                    </>
                );

            case "comparison":
                return (
                    <>
                        {renderReportFilter()}
                        <PlayerComparisonPanel
                            players={dashboardPlayers}
                            report={comparisonReport}
                            loading={loadingComparisonData}
                            error={comparisonError}
                            leftPlayerId={leftComparisonPlayerId}
                            rightPlayerId={rightComparisonPlayerId}
                            onLeftPlayerChange={setLeftComparisonPlayerId}
                            onRightPlayerChange={setRightComparisonPlayerId}
                            teamLabel={dashboardTeamLabel}
                        />
                    </>
                );

            case "user-roles":
                return <AdminUserRolesPanel />;

            default:
                return (
                    <AdminOverview
                        players={playerList}
                        seasons={seasons}
                        teams={teams}
                        onSectionChange={setActiveSection}
                        onEditPlayer={handleEditPlayer}
                        onDeletePlayer={handleDeletePlayer}
                    />
                );
        }
    };

    if (!authChecked || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#111]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <PageLayout
            username={username}
            role={role}
            onLogout={handleLogout}
            navSections={ADMIN_NAV}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            title={getSectionTitle(activeSection)}
            teamLabel="Admin Console"
            theme={ADMIN_THEME}
        >
            {showError && errorMsg && (
                <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg shadow-xl max-w-sm">
                    <span className="flex-1">{errorMsg}</span>
                    <button
                        onClick={() => setShowError(false)}
                        className="text-red-400 hover:text-red-200 text-lg leading-none cursor-pointer bg-transparent border-none"
                    >
                        ✕
                    </button>
                </div>
            )}

            {showSuccess && successMsg && (
                <div className="fixed top-20 right-5 z-50 flex items-center gap-3 bg-emerald-950 border border-emerald-800 text-emerald-300 text-sm px-4 py-3 rounded-lg shadow-xl max-w-sm">
                    <span className="flex-1">{successMsg}</span>
                    <button
                        onClick={() => setShowSuccess(false)}
                        className="text-emerald-400 hover:text-emerald-200 text-lg leading-none cursor-pointer bg-transparent border-none"
                    >
                        ✕
                    </button>
                </div>
            )}

            {renderAdminContent()}

            {editingPlayer && playerFormData && (
                <EditPlayerModal
                    player={editingPlayer}
                    teams={teams}
                    formData={playerFormData}
                    onChange={handlePlayerFormChange}
                    onClose={() => {
                        setEditingPlayer(null);
                        setPlayerFormData(null);
                    }}
                    onSave={handleSavePlayer}
                    saving={savingPlayer}
                />
            )}

            {playerPendingDelete && (
                <DeletePlayerModal
                    player={playerPendingDelete}
                    onClose={() => setPlayerPendingDelete(null)}
                    onConfirm={handleConfirmDeletePlayer}
                    deleting={deletingPlayer}
                />
            )}

            {editingTeam && teamFormData && (
                <EditTeamModal
                    team={editingTeam}
                    formData={teamFormData}
                    onChange={handleTeamFormChange}
                    onClose={() => {
                        setEditingTeam(null);
                        setTeamFormData(null);
                    }}
                    onSave={handleSaveTeam}
                    saving={savingTeam}
                />
            )}

            {teamPendingDelete && (
                <DeleteTeamModal
                    team={teamPendingDelete}
                    onClose={() => setTeamPendingDelete(null)}
                    onConfirm={handleConfirmDeleteTeam}
                    deleting={deletingTeam}
                />
            )}

            {seasonFormData && (
                <SeasonModal
                    mode={editingSeason ? "edit" : "create"}
                    formData={seasonFormData}
                    onChange={handleSeasonFormChange}
                    onClose={() => {
                        setEditingSeason(null);
                        setSeasonFormData(null);
                    }}
                    onSave={handleSaveSeason}
                    saving={savingSeason || creatingSeason}
                />
            )}

            {seasonPendingDelete && (
                <DeleteSeasonModal
                    season={seasonPendingDelete}
                    onClose={() => setSeasonPendingDelete(null)}
                    onConfirm={handleConfirmDeleteSeason}
                    deleting={deletingSeason}
                />
            )}

            {rosterFormData && (
                <RosterModal
                    players={playerList}
                    existingRosters={rosters}
                    formData={rosterFormData}
                    onChange={handleRosterFormChange}
                    onClose={() => setRosterFormData(null)}
                    onSave={handleSaveRoster}
                    saving={savingRoster}
                />
            )}

            {rosterPendingDelete && (
                <DeleteRosterModal
                    roster={rosterPendingDelete}
                    onClose={() => setRosterPendingDelete(null)}
                    onConfirm={handleConfirmDeleteRoster}
                    deleting={deletingRoster}
                />
            )}
        </PageLayout>
    );
}