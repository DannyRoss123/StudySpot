import React from "react";
import Filters from "./Filters.jsx";
import SpaceList from "./SpaceList.jsx";
import CheckInForm from "./CheckInForm.jsx";

const formatTimestamp = (date) => {
  if (!date) return "--";
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

function HomePage({
  spaces,
  filters,
  onFilterChange,
  sortBy,
  onSortChange,
  loading,
  error,
  onSelectSpace,
  selectedSpaceId,
  onSubmitCheckIn,
  isSubmitting,
  formRef,
  lastRefreshedAt,
  geoCoords,
}) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-4 pt-10 lg:px-0">
      <header className="rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-500 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-white/80">StudySpaces • Duke University</p>
            <h1 className="text-3xl font-semibold leading-tight">Find the perfect spot to focus</h1>
            <p className="mt-1 text-sm text-white/80">
              Live crowd insights, outlet availability, and real-time vibes from students just like you.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
            <p className="font-semibold">Live refresh</p>
            <p className="text-white/80">Every 30 seconds • Last update {formatTimestamp(lastRefreshedAt)}</p>
            {geoCoords && <p className="text-white/80">Distance sorted using your location</p>}
          </div>
        </div>
      </header>

      <Filters filters={filters} onFilterChange={onFilterChange} sortBy={sortBy} onSortChange={onSortChange} />

      <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl bg-white p-4 shadow-lg">
          <SpaceList
            spaces={spaces}
            loading={loading}
            error={error}
            onSelectSpace={onSelectSpace}
            selectedSpaceId={selectedSpaceId}
          />
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-lg" ref={formRef}>
          <CheckInForm
            spaces={spaces}
            onSubmit={onSubmitCheckIn}
            isSubmitting={isSubmitting}
            defaultSpaceId={selectedSpaceId}
          />
        </div>
      </section>
    </div>
  );
}

export default HomePage;
