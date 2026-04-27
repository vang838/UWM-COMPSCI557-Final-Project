import React from "react";
import PlayerList from "@/src/components/PlayerList";
import PlayerNavigation from "@/src/components/navigation";
import { playerAPI } from "@/src/api/players";
import { useApiData } from "@/src/hooks/useApiData";
import LoadingSpinner from "@/src/components/loadingSpinner";
import PageLayout from "@/src/components/pageLayout";

export default function PlayersPage() {
  const { data: players, loading, error } = useApiData(() => playerAPI.getAllPlayers());

  if (loading) {
    return (
      <PageLayout title="Player Directory" navigation={<PlayerNavigation />}>
        <LoadingSpinner />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Player Directory" navigation={<PlayerNavigation />}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full mx-auto">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Players</h2>
          <p className="text-red-700 mb-4">{error}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Player Directory" navigation={<PlayerNavigation />}>
      <PlayerList players={players || []} />
    </PageLayout>
  );
}