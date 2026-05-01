'use client';

import React, { useMemo } from "react";

interface SeasonSummaryPlayer {
    id?: number;
    player_id?: number;
    first_name?: string;
    last_name?: string;
    name?: string;
    position?: string;
    jersey_number?: number | string;
    is_active?: boolean;
}

interface SeasonSummaryStat {
    player_season_stat_id?: number;
    player_id?: number;
    player_name?: string;
    position?: string;
    stat_type_key?: string;
    stat_type_name?: string;
    stat_type_category?: string;
    stat_type_unit?: string;
    value?: number | string;
}

interface SeasonSummaryCoachAssignment {
    assignment_id?: number;
    coach_full_name?: string;
    role?: string;
    is_active?: boolean;
}

interface TopPerformer {
    label: string;
    playerName: string;
    position?: string;
    statName: string;
    value: number;
    unit?: string;
}

interface StatTypeTotal {
    category: string;
    statKey: string;
    statName: string;
    unit?: string;
    value: number;
}

interface SeasonSummaryPanelProps {
    players: SeasonSummaryPlayer[];
    stats: SeasonSummaryStat[];
    coaches: SeasonSummaryCoachAssignment[];
    teamLabel: string;
    selectedSeasonYear?: string;
}

const TOUCHDOWN_KEYS = [
    "passing_touchdowns",
    "rushing_touchdowns",
    "receiving_touchdowns",
];

const SUMMARY_STAT_CARDS = [
    {
        label: "Passing yards",
        keys: ["passing_yards"],
    },
    {
        label: "Rushing yards",
        keys: ["rushing_yards"],
    },
    {
        label: "Receiving yards",
        keys: ["receiving_yards"],
    },
    {
        label: "Total TDs",
        keys: TOUCHDOWN_KEYS,
    },
];

const TOP_PERFORMER_CONFIG = [
    {
        label: "Top passer",
        statKey: "passing_yards",
    },
    {
        label: "Top rusher",
        statKey: "rushing_yards",
    },
    {
        label: "Top receiver",
        statKey: "receiving_yards",
    },
    {
        label: "Top tackler",
        statKey: "tackles",
    },
];

const CATEGORY_ORDER: Record<string, number> = {
    passing: 1,
    rushing: 2,
    receiving: 3,
    defense: 4,
    kicking: 5,
    other: 999,
};

function toNumber(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatNumber(value: number): string {
    return Number.isInteger(value)
        ? value.toLocaleString()
        : value.toLocaleString(undefined, {
            maximumFractionDigits: 2,
        });
}

function sumStatsByKeys(stats: SeasonSummaryStat[], keys: string[]): number {
    return stats
        .filter((stat) => stat.stat_type_key && keys.includes(stat.stat_type_key))
        .reduce((total, stat) => total + toNumber(stat.value), 0);
}

function getUniquePlayerCountFromStats(stats: SeasonSummaryStat[]): number {
    const playerIds = new Set<string>();

    stats.forEach((stat) => {
        if (stat.player_id !== undefined && stat.player_id !== null) {
            playerIds.add(String(stat.player_id));
        }
    });

    return playerIds.size;
}

function buildPositionBreakdown(
    players: SeasonSummaryPlayer[],
    stats: SeasonSummaryStat[]
) {
    const positionCounts = new Map<string, number>();

    if (players.length > 0) {
        players.forEach((player) => {
            const position = player.position || "Unknown";
            positionCounts.set(position, (positionCounts.get(position) ?? 0) + 1);
        });
    } else {
        const playerPositionMap = new Map<string, string>();

        stats.forEach((stat) => {
            if (stat.player_id === undefined || stat.player_id === null) {
                return;
            }

            playerPositionMap.set(
                String(stat.player_id),
                stat.position || "Unknown"
            );
        });

        playerPositionMap.forEach((position) => {
            positionCounts.set(position, (positionCounts.get(position) ?? 0) + 1);
        });
    }

    return Array.from(positionCounts.entries())
        .map(([position, count]) => ({
            position,
            count,
        }))
        .sort((a, b) => {
            if (b.count !== a.count) {
                return b.count - a.count;
            }

            return a.position.localeCompare(b.position);
        });
}

function buildStatTypeTotals(stats: SeasonSummaryStat[]): StatTypeTotal[] {
    const totals = new Map<string, StatTypeTotal>();

    stats.forEach((stat) => {
        const category = stat.stat_type_category || "other";
        const statKey = stat.stat_type_key || "unknown";
        const statName = stat.stat_type_name || statKey;
        const unit = stat.stat_type_unit || undefined;

        const mapKey = `${category}:${statKey}:${unit ?? ""}`;

        const existing = totals.get(mapKey);

        if (existing) {
            existing.value += toNumber(stat.value);
        } else {
            totals.set(mapKey, {
                category,
                statKey,
                statName,
                unit,
                value: toNumber(stat.value),
            });
        }
    });

    return Array.from(totals.values()).sort((a, b) => {
        const categoryA = CATEGORY_ORDER[a.category] ?? 999;
        const categoryB = CATEGORY_ORDER[b.category] ?? 999;

        if (categoryA !== categoryB) {
            return categoryA - categoryB;
        }

        return a.statName.localeCompare(b.statName);
    });
}

function groupStatTotalsByCategory(
    totals: StatTypeTotal[]
): Record<string, StatTypeTotal[]> {
    return totals.reduce<Record<string, StatTypeTotal[]>>((groups, total) => {
        if (!groups[total.category]) {
            groups[total.category] = [];
        }

        groups[total.category].push(total);
        return groups;
    }, {});
}

function formatCategoryLabel(category: string): string {
    return category
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function findTopPerformer(
    stats: SeasonSummaryStat[],
    label: string,
    statKey: string
): TopPerformer | null {
    const matchingStats = stats
        .filter((stat) => stat.stat_type_key === statKey)
        .sort((a, b) => toNumber(b.value) - toNumber(a.value));

    const topStat = matchingStats[0];

    if (!topStat) {
        return null;
    }

    return {
        label,
        playerName: topStat.player_name || "Unknown player",
        position: topStat.position,
        statName: topStat.stat_type_name || statKey,
        value: toNumber(topStat.value),
        unit: topStat.stat_type_unit,
    };
}

function SummaryCard({
    label,
    value,
    sublabel,
}: {
    label: string;
    value: string | number;
    sublabel?: string;
}) {
    return (
        <div className="bg-[#111] border border-white/8 rounded-lg px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                {label}
            </p>

            <p className="text-[22px] font-medium text-white leading-none">
                {value}
            </p>

            {sublabel && (
                <p className="text-[10px] text-gray-600 mt-1">
                    {sublabel}
                </p>
            )}
        </div>
    );
}

function SectionCard({
    title,
    children,
    rightLabel,
}: {
    title: string;
    children: React.ReactNode;
    rightLabel?: string;
}) {
    return (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
                <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                    {title}
                </span>

                {rightLabel && (
                    <span className="text-[10px] text-gray-500">
                        {rightLabel}
                    </span>
                )}
            </div>

            <div className="p-3">
                {children}
            </div>
        </div>
    );
}

export default function SeasonSummaryPanel({
    players,
    stats,
    coaches,
    teamLabel,
    selectedSeasonYear,
}: SeasonSummaryPanelProps) {
    const summary = useMemo(() => {
        const rosterSize =
            players.length > 0
                ? players.length
                : getUniquePlayerCountFromStats(stats);

        const activeCoachCount = coaches.filter(
            (coach) => coach.is_active !== false
        ).length;

        const statCards = SUMMARY_STAT_CARDS.map((card) => ({
            label: card.label,
            value: sumStatsByKeys(stats, card.keys),
        }));

        const topPerformers = TOP_PERFORMER_CONFIG
            .map((config) =>
                findTopPerformer(stats, config.label, config.statKey)
            )
            .filter((performer): performer is TopPerformer => performer !== null);

        const positionBreakdown = buildPositionBreakdown(players, stats);
        const statTypeTotals = buildStatTypeTotals(stats);
        const groupedStatTotals = groupStatTotalsByCategory(statTypeTotals);

        const activePlayers = players.filter(
            (player) => player.is_active !== false
        ).length;

        return {
            rosterSize,
            activePlayers,
            activeCoachCount,
            statCards,
            topPerformers,
            positionBreakdown,
            statTypeTotals,
            groupedStatTotals,
        };
    }, [players, stats, coaches]);

    const statTotalCategories = Object.keys(summary.groupedStatTotals).sort((a, b) => {
        const orderA = CATEGORY_ORDER[a] ?? 999;
        const orderB = CATEGORY_ORDER[b] ?? 999;

        if (orderA !== orderB) {
            return orderA - orderB;
        }

        return a.localeCompare(b);
    });

    return (
        <div className="space-y-3">
            <SectionCard
                title="Season summary"
                rightLabel={selectedSeasonYear ? `${teamLabel}` : teamLabel}
            >
                <div className="grid grid-cols-6 gap-2">
                    <SummaryCard
                        label="Roster size"
                        value={summary.rosterSize || "No data"}
                        sublabel={`${summary.activePlayers || summary.rosterSize} active`}
                    />

                    <SummaryCard
                        label="Coaches"
                        value={summary.activeCoachCount || "No data"}
                        sublabel="active staff"
                    />

                    {summary.statCards.map((card) => (
                        <SummaryCard
                            key={card.label}
                            label={card.label}
                            value={card.value > 0 ? formatNumber(card.value) : "No data"}
                        />
                    ))}
                </div>
            </SectionCard>

            <div className="grid grid-cols-2 gap-3">
                <SectionCard title="Top performers" rightLabel={teamLabel}>
                    {summary.topPerformers.length > 0 ? (
                        <div className="space-y-2">
                            {summary.topPerformers.map((performer) => (
                                <div
                                    key={`${performer.label}-${performer.statName}`}
                                    className="flex items-center justify-between gap-3 border-b border-white/6 last:border-b-0 pb-2 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <p className="text-[10px] uppercase tracking-widest text-gray-500">
                                            {performer.label}
                                        </p>

                                        <p className="text-[12px] font-medium text-white truncate">
                                            {performer.playerName}
                                        </p>

                                        <p className="text-[10px] text-gray-500">
                                            {performer.position || "—"} · {performer.statName}
                                        </p>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="text-[16px] font-medium text-white">
                                            {formatNumber(performer.value)}
                                        </p>

                                        {performer.unit && (
                                            <p className="text-[10px] text-gray-600">
                                                {performer.unit}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-6 text-center text-[12px] text-gray-500">
                            No top performers available for this season.
                        </div>
                    )}
                </SectionCard>

                <SectionCard title="Position breakdown" rightLabel={`${summary.rosterSize} players`}>
                    {summary.positionBreakdown.length > 0 ? (
                        <div className="space-y-2">
                            {summary.positionBreakdown.map((item) => {
                                const percentage =
                                    summary.rosterSize > 0
                                        ? Math.round((item.count / summary.rosterSize) * 100)
                                        : 0;

                                return (
                                    <div key={item.position}>
                                        <div className="flex items-center justify-between text-[12px] mb-1">
                                            <span className="text-gray-300">
                                                {item.position}
                                            </span>

                                            <span className="text-white font-medium">
                                                {item.count}
                                            </span>
                                        </div>

                                        <div className="h-[3px] bg-white/8 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#c49a22] rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-6 text-center text-[12px] text-gray-500">
                            No position data available.
                        </div>
                    )}
                </SectionCard>
            </div>

            <SectionCard title="Tracked stat totals" rightLabel="grouped by category">
                {statTotalCategories.length > 0 ? (
                    <div className="space-y-3">
                        {statTotalCategories.map((category) => (
                            <div key={category}>
                                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                                    {formatCategoryLabel(category)}
                                </p>

                                <div className="grid grid-cols-4 gap-2">
                                    {summary.groupedStatTotals[category].map((item) => (
                                        <div
                                            key={`${item.category}-${item.statKey}-${item.unit ?? "none"}`}
                                            className="bg-[#111] border border-white/8 rounded-lg px-3 py-2"
                                        >
                                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 truncate">
                                                {item.statName}
                                            </p>

                                            <p className="text-[18px] font-medium text-white leading-none">
                                                {formatNumber(item.value)}
                                            </p>

                                            {item.unit && (
                                                <p className="text-[10px] text-gray-600 mt-1">
                                                    {item.unit}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-6 text-center text-[12px] text-gray-500">
                        No stat totals available for this season.
                    </div>
                )}
            </SectionCard>
        </div>
    );
}