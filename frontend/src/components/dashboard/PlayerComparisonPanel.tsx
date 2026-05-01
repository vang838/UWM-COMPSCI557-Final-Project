'use client';

import React from "react";

interface ComparisonPlayerOption {
    id?: number;
    player_id?: number;
    first_name?: string;
    last_name?: string;
    name?: string;
    position?: string;
    jersey_number?: number | string;
}

interface ComparisonReportPlayer {
    player_id: number;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    position?: string;
}

interface ComparisonReportRow {
    stat_key: string;
    stat_name: string;
    stat_category: string;
    stat_unit?: string;
    left_value: number;
    right_value: number;
    left_percent: number;
    right_percent: number;
}

interface ComparisonReport {
    team_id: number;
    year: number;
    left_player: ComparisonReportPlayer;
    right_player: ComparisonReportPlayer;
    rows: ComparisonReportRow[];
}

interface PlayerComparisonPanelProps {
    players: ComparisonPlayerOption[];
    report: ComparisonReport | null;
    loading: boolean;
    error?: string;
    leftPlayerId: string;
    rightPlayerId: string;
    onLeftPlayerChange: (playerId: string) => void;
    onRightPlayerChange: (playerId: string) => void;
    teamLabel: string;
}

function getPlayerId(player: ComparisonPlayerOption): string {
    return String(player.player_id ?? player.id ?? "");
}

function displayPlayerName(player: ComparisonPlayerOption): string {
    return (
        player.name ||
        `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim() ||
        "Unknown player"
    );
}

function formatNumber(value: number): string {
    return Number.isInteger(value)
        ? value.toLocaleString()
        : value.toLocaleString(undefined, {
              maximumFractionDigits: 2,
          });
}

function formatCategoryLabel(category: string): string {
    return category
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function PlayerSelect({
    label,
    value,
    players,
    onChange,
    excludePlayerId,
}: {
    label: string;
    value: string;
    players: ComparisonPlayerOption[];
    onChange: (playerId: string) => void;
    excludePlayerId?: string;
}) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-gray-500">
                {label}
            </span>

            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-[12px] text-white outline-none focus:border-white/30"
            >
                <option value="">Select player</option>

                {players.map((player) => {
                    const id = getPlayerId(player);

                    return (
                        <option
                            key={id}
                            value={id}
                            disabled={excludePlayerId === id}
                        >
                            {displayPlayerName(player)} · {player.position || "—"} · #
                            {player.jersey_number ?? "—"}
                        </option>
                    );
                })}
            </select>
        </label>
    );
}

export default function PlayerComparisonPanel({
    players,
    report,
    loading,
    error,
    leftPlayerId,
    rightPlayerId,
    onLeftPlayerChange,
    onRightPlayerChange,
    teamLabel,
}: PlayerComparisonPanelProps) {
    const leftPlayer = report?.left_player;
    const rightPlayer = report?.right_player;

    return (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
                <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                    Player comparison
                </span>

                <span className="text-[10px] text-gray-500">{teamLabel}</span>
            </div>

            <div className="p-3 space-y-3">
                <div className="grid grid-cols-[1fr_1fr] gap-3">
                    <PlayerSelect
                        label="Left player"
                        value={leftPlayerId}
                        players={players}
                        onChange={onLeftPlayerChange}
                        excludePlayerId={rightPlayerId}
                    />

                    <PlayerSelect
                        label="Right player"
                        value={rightPlayerId}
                        players={players}
                        onChange={onRightPlayerChange}
                        excludePlayerId={leftPlayerId}
                    />
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center bg-[#111] border border-white/8 rounded-lg px-3 py-3">
                    <div className="text-center">
                        <p className="text-[13px] font-medium text-[#f0c040]">
                            {leftPlayer?.full_name || "Left player"}
                        </p>
                        <p className="text-[10px] text-gray-500">
                            {leftPlayer?.position || "—"}
                        </p>
                    </div>

                    <span className="text-[10px] text-gray-500">vs</span>

                    <div className="text-center">
                        <p className="text-[13px] font-medium text-blue-400">
                            {rightPlayer?.full_name || "Right player"}
                        </p>
                        <p className="text-[10px] text-gray-500">
                            {rightPlayer?.position || "—"}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-10 text-center text-sm text-gray-500">
                        Loading SQL comparison report...
                    </div>
                ) : error ? (
                    <div className="py-10 text-center text-sm text-red-400">
                        {error}
                    </div>
                ) : !leftPlayerId || !rightPlayerId ? (
                    <div className="py-10 text-center text-sm text-gray-500">
                        Select two players to compare.
                    </div>
                ) : report?.rows?.length ? (
                    <div className="space-y-2">
                        {report.rows.map((row) => (
                            <div
                                key={row.stat_key}
                                className="border border-white/8 bg-[#111] rounded-lg px-3 py-3"
                            >
                                <div className="mb-2">
                                    <p className="text-[12px] font-medium text-white">
                                        {row.stat_name}
                                    </p>
                                    <p className="text-[10px] text-gray-500">
                                        {formatCategoryLabel(row.stat_category)}
                                        {row.stat_unit ? ` · ${row.stat_unit}` : ""}
                                    </p>
                                </div>

                                <div className="flex items-center justify-center gap-2 mb-3 text-[12px]">
                                    <span className="font-medium text-[#f0c040]">
                                        {formatNumber(row.left_value)}
                                    </span>
                                    <span className="text-gray-500">vs</span>
                                    <span className="font-medium text-blue-400">
                                        {formatNumber(row.right_value)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 items-center">
                                    <div className="h-[5px] bg-white/8 rounded-full overflow-hidden flex justify-end">
                                        <div
                                            className="h-full bg-[#c49a22] rounded-full"
                                            style={{ width: `${row.left_percent}%` }}
                                        />
                                    </div>

                                    <div className="h-[5px] bg-white/8 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${row.right_percent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-10 text-center text-sm text-gray-500">
                        No comparison data available for the selected players.
                    </div>
                )}
            </div>
        </div>
    );
}