// frontend/src/components/admin/AdminPlayerRecords.tsx
'use client';

import React, { useEffect, useMemo, useState } from "react";

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
    date_of_birth?: string | null;
    age?: number | null;
    college?: string;
    height?: number | string | null;
    weight?: number | string | null;
    headshot_url?: string;
    is_active?: boolean;
}

interface Team {
    id?: number;
    team_id?: number;
    city?: string;
    state?: string;
    team_name?: string;
    display_name?: string;
    abbreviation?: string;
}

interface AdminPlayerRecordsProps {
    players: Player[];
    teams: Team[];
    onEdit: (player: Player) => void;
    onDelete: (player: Player) => void;
    title?: string;
    description?: string;
    pageSize?: number;
    defaultStatusFilter?: "all" | "active" | "inactive";
}

function displayPlayerName(player: Player): string {
    return (
        player.name ||
        `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim() ||
        "Unknown player"
    );
}

function getPlayerId(player: Player): number | string {
    return (
        player.player_id ??
        player.id ??
        `${displayPlayerName(player)}-${player.position ?? "unknown"}`
    );
}

function getTeamId(team: Team): number | string | undefined {
    return team.team_id ?? team.id;
}

function getTeamDisplayName(team: Team): string {
    return (
        team.display_name ||
        `${team.city ?? ""} ${team.team_name ?? ""}`.trim() ||
        team.team_name ||
        team.abbreviation ||
        "Unknown team"
    );
}

function getPlayerTeamId(player: Player): string {
    return player.team !== undefined && player.team !== null
        ? String(player.team)
        : "";
}

function buildTeamLookup(teams: Team[]): Map<string, string> {
    const lookup = new Map<string, string>();

    teams.forEach((team) => {
        const teamId = getTeamId(team);

        if (teamId !== undefined) {
            lookup.set(String(teamId), getTeamDisplayName(team));
        }
    });

    return lookup;
}

function getPlayerTeamLabel(player: Player, teamLookup: Map<string, string>): string {
    const teamId = getPlayerTeamId(player);

    if (!teamId) {
        return "No team";
    }

    return teamLookup.get(teamId) ?? `Team #${teamId}`;
}

function displayAdminValue(value?: string | number | null): string | number {
    return value === null || value === undefined || value === "" ? "—" : value;
}

function formatAdminHeight(height?: number | string | null): string {
    if (height === null || height === undefined || height === "") {
        return "—";
    }

    const numericHeight = Math.round(Number(height));

    if (Number.isNaN(numericHeight)) {
        return `${height} in`;
    }

    const feet = Math.floor(numericHeight / 12);
    const inches = numericHeight % 12;

    return `${feet}'${inches}"`;
}

function formatAdminWeight(weight?: number | string | null): string {
    if (weight === null || weight === undefined || weight === "") {
        return "—";
    }

    const numericWeight = Number(weight);

    if (Number.isNaN(numericWeight)) {
        return `${weight} lbs`;
    }

    return `${numericWeight.toFixed(0)} lbs`;
}

function PlayerRow({
    player,
    teamLookup,
    onEdit,
    onDelete,
}: {
    player: Player;
    teamLookup: Map<string, string>;
    onEdit: (player: Player) => void;
    onDelete: (player: Player) => void;
}) {
    const active = player.is_active !== false;

    return (
        <div className="grid grid-cols-[1.6fr_70px_1.3fr_60px_1.2fr_70px_80px_90px_auto] gap-3 items-center px-3 py-2 border-b border-white/6 last:border-b-0 hover:bg-white/3 transition-colors text-[12px]">
            <span className="text-white font-medium truncate">
                {displayPlayerName(player)}
            </span>

            <span className="text-gray-400">
                {player.position || "—"}
            </span>

            <span className="text-gray-400 truncate">
                {getPlayerTeamLabel(player, teamLookup)}
            </span>

            <span className="text-gray-400">
                {displayAdminValue(player.age)}
            </span>

            <span className="text-gray-400 truncate">
                {displayAdminValue(player.college)}
            </span>

            <span className="text-gray-400">
                {formatAdminHeight(player.height)}
            </span>

            <span className="text-gray-400">
                {formatAdminWeight(player.weight)}
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
}

export default function AdminPlayerRecords({
    players,
    teams,
    onEdit,
    onDelete,
    title = "Player records",
    description = "Search, filter, group, edit, or delete player records.",
    pageSize = 25,
    defaultStatusFilter = "all",
}: AdminPlayerRecordsProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [teamFilter, setTeamFilter] = useState("all");
    const [positionFilter, setPositionFilter] = useState("all");
    const [statusFilter, setStatusFilter] =
        useState<"all" | "active" | "inactive">(defaultStatusFilter);
    const [viewMode, setViewMode] = useState<"table" | "grouped">("table");
    const [visibleCount, setVisibleCount] = useState(pageSize);

    const teamLookup = useMemo(() => buildTeamLookup(teams), [teams]);

    const positions = useMemo(() => {
        return Array.from(
            new Set(
                players
                    .map((player) => player.position)
                    .filter((position): position is string => Boolean(position))
            )
        ).sort((a, b) => a.localeCompare(b));
    }, [players]);

    const filteredPlayers = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return players
            .filter((player) => {
                const name = displayPlayerName(player).toLowerCase();
                const college = (player.college || "").toLowerCase();
                const teamId = getPlayerTeamId(player);
                const active = player.is_active !== false;

                const matchesSearch =
                    !normalizedSearch ||
                    name.includes(normalizedSearch) ||
                    college.includes(normalizedSearch) ||
                    String(player.player_id ?? player.id ?? "").includes(normalizedSearch);

                const matchesTeam =
                    teamFilter === "all" || teamId === teamFilter;

                const matchesPosition =
                    positionFilter === "all" || player.position === positionFilter;

                const matchesStatus =
                    statusFilter === "all" ||
                    (statusFilter === "active" && active) ||
                    (statusFilter === "inactive" && !active);

                return matchesSearch && matchesTeam && matchesPosition && matchesStatus;
            })
            .sort((a, b) => {
                const teamCompare = getPlayerTeamLabel(a, teamLookup).localeCompare(
                    getPlayerTeamLabel(b, teamLookup)
                );

                if (teamCompare !== 0) {
                    return teamCompare;
                }

                return displayPlayerName(a).localeCompare(displayPlayerName(b));
            });
    }, [players, searchTerm, teamFilter, positionFilter, statusFilter, teamLookup]);

    const visiblePlayers = filteredPlayers.slice(0, visibleCount);

    const groupedPlayers = useMemo(() => {
        const groups = new Map<string, Player[]>();

        visiblePlayers.forEach((player) => {
            const teamName = getPlayerTeamLabel(player, teamLookup);

            if (!groups.has(teamName)) {
                groups.set(teamName, []);
            }

            groups.get(teamName)?.push(player);
        });

        return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [visiblePlayers, teamLookup]);

    const activeFilterCount = [
        searchTerm.trim() ? "search" : "",
        teamFilter !== "all" ? "team" : "",
        positionFilter !== "all" ? "position" : "",
        statusFilter !== "all" ? "status" : "",
    ].filter(Boolean).length;

    useEffect(() => {
        setVisibleCount(pageSize);
    }, [searchTerm, teamFilter, positionFilter, statusFilter, viewMode, pageSize]);

    const clearFilters = () => {
        setSearchTerm("");
        setTeamFilter("all");
        setPositionFilter("all");
        setStatusFilter(defaultStatusFilter);
        setVisibleCount(pageSize);
    };

    return (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
            <div className="px-3 py-3 border-b border-white/8">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                            {title} ({filteredPlayers.length})
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {description}
                        </p>
                    </div>

                    <div className="text-[10px] text-gray-500 whitespace-nowrap">
                        Showing {Math.min(visiblePlayers.length, filteredPlayers.length)} of{" "}
                        {filteredPlayers.length}
                    </div>
                </div>

                <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr_auto] gap-2">
                    <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search player..."
                        className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-[12px] text-white outline-none focus:border-white/30"
                    />

                    <select
                        value={teamFilter}
                        onChange={(event) => setTeamFilter(event.target.value)}
                        className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-[12px] text-white outline-none focus:border-white/30"
                    >
                        <option value="all">All teams</option>
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

                    <select
                        value={positionFilter}
                        onChange={(event) => setPositionFilter(event.target.value)}
                        className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-[12px] text-white outline-none focus:border-white/30"
                    >
                        <option value="all">All positions</option>
                        {positions.map((position) => (
                            <option key={position} value={position}>
                                {position}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value as "all" | "active" | "inactive")
                        }
                        className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-[12px] text-white outline-none focus:border-white/30"
                    >
                        <option value="all">All status</option>
                        <option value="active">Active only</option>
                        <option value="inactive">Inactive only</option>
                    </select>

                    <select
                        value={viewMode}
                        onChange={(event) =>
                            setViewMode(event.target.value as "table" | "grouped")
                        }
                        className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-[12px] text-white outline-none focus:border-white/30"
                    >
                        <option value="table">Table view</option>
                        <option value="grouped">Group by team</option>
                    </select>

                    <button
                        onClick={clearFilters}
                        disabled={activeFilterCount === 0 && viewMode === "table"}
                        className="text-[10px] px-2.5 py-1 rounded border border-white/10 text-gray-300 hover:text-white hover:border-white/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-transparent"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {viewMode === "table" ? (
                <>
                    <div className="grid grid-cols-[1.6fr_70px_1.3fr_60px_1.2fr_70px_80px_90px_auto] gap-3 px-3 py-2 border-b border-white/8 text-[10px] uppercase tracking-widest text-gray-500">
                        <span>Name</span>
                        <span>Pos</span>
                        <span>Team</span>
                        <span>Age</span>
                        <span>College</span>
                        <span>Height</span>
                        <span>Weight</span>
                        <span>Status</span>
                        <span>Actions</span>
                    </div>

                    {visiblePlayers.length > 0 ? (
                        visiblePlayers.map((player) => (
                            <PlayerRow
                                key={getPlayerId(player)}
                                player={player}
                                teamLookup={teamLookup}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))
                    ) : (
                        <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                            No players match the selected filters.
                        </div>
                    )}
                </>
            ) : (
                <div>
                    {groupedPlayers.length > 0 ? (
                        groupedPlayers.map(([teamName, groupPlayers]) => (
                            <div key={teamName} className="border-b border-white/8 last:border-b-0">
                                <div className="px-3 py-2 bg-[#111] border-b border-white/8 flex items-center justify-between">
                                    <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                                        {teamName}
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                        {groupPlayers.length} players
                                    </span>
                                </div>

                                <div className="grid grid-cols-[1.6fr_70px_1.3fr_60px_1.2fr_70px_80px_90px_auto] gap-3 px-3 py-2 border-b border-white/8 text-[10px] uppercase tracking-widest text-gray-500">
                                    <span>Name</span>
                                    <span>Pos</span>
                                    <span>Team</span>
                                    <span>Age</span>
                                    <span>College</span>
                                    <span>Height</span>
                                    <span>Weight</span>
                                    <span>Status</span>
                                    <span>Actions</span>
                                </div>

                                {groupPlayers.map((player) => (
                                    <PlayerRow
                                        key={getPlayerId(player)}
                                        player={player}
                                        teamLookup={teamLookup}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                            No players match the selected filters.
                        </div>
                    )}
                </div>
            )}

            {visibleCount < filteredPlayers.length && (
                <div className="px-3 py-2 border-t border-white/8 text-center">
                    <button
                        onClick={() => setVisibleCount((current) => current + pageSize)}
                        className="text-[10px] px-3 py-1 rounded border border-white/10 text-gray-300 hover:text-white hover:border-white/30 transition-colors bg-transparent"
                    >
                        Show more
                    </button>
                </div>
            )}
        </div>
    );
}