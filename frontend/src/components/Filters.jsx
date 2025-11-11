import React from "react";

const toggleConfigs = [
  { key: "quietOnly", label: "Quiet spaces only" },
  { key: "outletsOnly", label: "Need outlets" },
  { key: "recentOnly", label: "Currently active" },
];

function Filters({ filters, onFilterChange, sortBy, onSortChange }) {
  const handleToggle = (key) => {
    onFilterChange({ ...filters, [key]: !filters[key] });
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-lg">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-3">
          {toggleConfigs.map((toggle) => (
            <label
              key={toggle.key}
              className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${filters[toggle.key] ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-600"}`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={filters[toggle.key]}
                onChange={() => handleToggle(toggle.key)}
              />
              <span>{toggle.label}</span>
            </label>
          ))}
        </div>
        <div className="text-sm text-slate-600">
          <label className="mr-2 font-medium" htmlFor="sort-select">
            Sort by
          </label>
          <select
            id="sort-select"
            className="rounded-full border border-slate-200 px-4 py-2"
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value)}
          >
            <option value="lastUpdated">Last updated</option>
            <option value="distance">Distance</option>
            <option value="crowding">Crowding</option>
            <option value="noise">Noise level</option>
          </select>
        </div>
      </div>
    </section>
  );
}

export default Filters;
