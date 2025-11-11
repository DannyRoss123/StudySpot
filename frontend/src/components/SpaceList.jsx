import React from "react";

const crowdingColor = {
  empty: "bg-emerald-100 text-emerald-700",
  some: "bg-amber-100 text-amber-700",
  full: "bg-rose-100 text-rose-700",
};

const noiseEmoji = {
  quiet: "🤫",
  moderate: "🙂",
  loud: "🔊",
};

const outletsEmoji = {
  yes: "⚡",
  some: "🔌",
  no: "⛔",
};

const lastUpdatedCopy = (minutes) => {
  if (minutes == null) return "No recent data";
  if (minutes < 1) return "Just now";
  return `${minutes} min ago`;
};

function SpaceCard({ space, onSelect, isSelected }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(space.id)}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition hover:shadow ${isSelected ? "border-sky-500 bg-sky-50" : "border-slate-100 bg-white"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{space.name}</h3>
          <p className="text-sm text-slate-500">{space.building}</p>
        </div>
        {space.recent_crowding && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${crowdingColor[space.recent_crowding]}`}>
            {space.recent_crowding.toUpperCase()}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span>{noiseEmoji[space.recent_noise_level] || "--"} Noise</span>
        <span>{outletsEmoji[space.recent_outlets] || "--"} Outlets</span>
        <span className="text-slate-400">{lastUpdatedCopy(space.last_updated_minutes)}</span>
        {space.distance != null && <span>{space.distance} mi</span>}
        {space.occupancy_score != null && <span>Score {space.occupancy_score}</span>}
      </div>
    </button>
  );
}

function SpaceList({ spaces, loading, error, onSelectSpace, selectedSpaceId }) {
  if (loading) {
    return <p className="py-8 text-center text-sm text-slate-500">Loading real-time updates…</p>;
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-rose-500">
        <p>{error}</p>
        <p className="text-slate-400">Try refreshing the page.</p>
      </div>
    );
  }

  if (!spaces.length) {
    return <p className="py-8 text-center text-sm text-slate-500">No spaces match your filters right now.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {spaces.map((space) => (
        <SpaceCard key={space.id} space={space} onSelect={onSelectSpace} isSelected={space.id === selectedSpaceId} />
      ))}
    </div>
  );
}

export default SpaceList;
