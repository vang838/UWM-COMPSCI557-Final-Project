'use client';

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import PageLayout, { NavSection, LayoutTheme } from "@/src/components/pageLayout";

import { playerAPI } from "@/src/api/players";
import { seasonAPI } from "@/src/api/seasons";
import { teamAPI } from "@/src/api/teams";

import { useApiData } from "@/src/hooks/useApiData";

// Types
interface Player {
    id?: number;
    player_id?: number;
    first_name?: string;
    last_name?: string;
    name?: string;
    position?: string;
    jersey_number?: number | string;
    team?: number | string;
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

function PlayerRecordsTable({ players }: { players: Player[] }) {
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
                                    <button className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent">
                                        Edit
                                    </button>
                                    <button className="text-[10px] px-2 py-0.5 rounded border border-red-900/50 text-red-500 hover:border-red-700 hover:text-red-300 transition-colors cursor-pointer bg-transparent">
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
}: {
    players: Player[];
    seasons: Season[];
    teams: Team[];
    onSectionChange: (section: string) => void;
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

            <PlayerRecordsTable players={players.slice(0, 10)} />

            {players.length > 10 && (
                <div className="px-3 py-2 border border-white/8 rounded-lg text-[11px] text-gray-500 text-center bg-[#1a1a1a]">
                    Showing 10 of {players.length} players —{" "}
                    <button
                        onClick={() => onSectionChange("players")}
                        className="text-[#f0c040] hover:underline cursor-pointer bg-transparent border-none"
                    >
                        view all
                    </button>
                </div>
            )}
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
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                Seasons ({seasons.length})
            </p>

            <button
                onClick={onAdd}
                className="text-[10px] px-2.5 py-1 rounded border border-white/10 text-gray-300 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent"
            >
                Add season
            </button>

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

// Page component
export default function AdminPage() {
    const router = useRouter();

    const [authChecked, setAuthChecked] = useState(false);
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");
    const [activeSection, setActiveSection] = useState("dashboard");

    // toast notifications
    const [showError, setShowError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const [teams, setTeams] = useState<Team[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);

    // team modals
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [teamFormData, setTeamFormData] = useState<TeamFormData | null>(null);
    const [teamPendingDelete, setTeamPendingDelete] = useState<Team | null>(null);
    const [savingTeam, setSavingTeam] = useState(false);
    const [deletingTeam, setDeletingTeam] = useState(false);

    // season modals
    const [editingSeason, setEditingSeason] = useState<Season | null>(null);
    const [seasonFormData, setSeasonFormData] = useState<SeasonFormData | null>(null);
    const [seasonPendingDelete, setSeasonPendingDelete] = useState<Season | null>(null);
    const [savingSeason, setSavingSeason] = useState(false);
    const [deletingSeason, setDeletingSeason] = useState(false);
    const [creatingSeason, setCreatingSeason] = useState(false);

    const fetchPlayers = useCallback(() => playerAPI.getAllPlayers(), []);
    const {
        data: playersResponse,
        loading,
        error: apiError,
    } = useApiData(fetchPlayers);

    const playerList = useMemo(
        () => normalizeApiList<Player>(playersResponse ?? []),
        [playersResponse]
    );

    const fetchAdminReferenceData = useCallback(async () => {
        const [seasonData, teamData] = await Promise.all([
            safeApiCall<unknown[]>(() => seasonAPI.getAllSeasons(), []),
            safeApiCall<unknown[]>(() => teamAPI.getAllTeams(), []),
        ]);

        const seasonList = normalizeApiList<Season>(seasonData)
            .filter((season) => season.year !== undefined && season.year !== null)
            .sort((a, b) => Number(b.year) - Number(a.year));

        const teamList = normalizeApiList<Team>(teamData)
            .filter((team) => team.team_id !== undefined || team.id !== undefined)
            .sort((a, b) => getTeamDisplayName(a).localeCompare(getTeamDisplayName(b)));

        setSeasons(seasonList);
        setTeams(teamList);
    }, []);

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

        fetchAdminReferenceData();
    }, [authChecked, fetchAdminReferenceData]);

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

    const renderAdminContent = () => {
        switch (activeSection) {
            case "dashboard":
                return (
                    <AdminOverview
                        players={playerList}
                        teams={teams}
                        seasons={seasons}
                        onSectionChange={setActiveSection}
                    />
                );

            case "players":
                return <PlayerRecordsTable players={playerList} />;

            case "manage-seasons":
                return <SeasonsPanel seasons={seasons} />;

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
                    <EmptySection
                        title="Season summary"
                        description="This section should summarize season-level performance once the backend season summary API is available."
                    />
                );

            case "coaches":
                return (
                    <EmptySection
                        title="Coaches"
                        description="This section should list coaching staff and allow admin-only coach management once the coaches API is available."
                    />
                );

            case "team-roster":
                return (
                    <EmptySection
                        title="Team roster"
                        description="This section should show roster assignments by team and season once the teams and roster APIs are available."
                    />
                );

            case "player-stats":
                return (
                    <EmptySection
                        title="Player stats"
                        description="This section should let admins review, enter, and correct player statistics."
                    />
                );

            case "stat-types":
                return (
                    <EmptySection
                        title="Stat types"
                        description="This section should manage the supported statistic categories used by the dashboard and reports."
                    />
                );

            case "leaderboard":
                return (
                    <EmptySection
                        title="Leaderboard"
                        description="This section should show ranked player statistics once the leaderboard API is available."
                    />
                );

            case "comparison":
                return (
                    <EmptySection
                        title="Player comparison"
                        description="This section should compare two selected players once the comparison API is available."
                    />
                );

            case "user-roles":
                return (
                    <EmptySection
                        title="User roles"
                        description="This section should manage user roles and permissions. Keep this admin-only."
                    />
                );

            default:
                return (
                    <AdminOverview
                        players={playerList}
                        seasons={seasons}
                        teams={teams}
                        onSectionChange={setActiveSection}
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

            {renderAdminContent()}

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
        </PageLayout>
    );
}