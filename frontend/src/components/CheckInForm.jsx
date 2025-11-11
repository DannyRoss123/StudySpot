import React, { useEffect, useState } from "react";

const noiseOptions = [
  { value: "quiet", label: "Quiet" },
  { value: "moderate", label: "Moderate" },
  { value: "loud", label: "Loud" },
];

const crowdingOptions = [
  { value: "empty", label: "Plenty of seats" },
  { value: "some", label: "Some seats left" },
  { value: "full", label: "Packed" },
];

const outletOptions = [
  { value: "yes", label: "Lots of outlets" },
  { value: "some", label: "Some outlets" },
  { value: "no", label: "No outlets" },
];

function CheckInForm({ spaces, defaultSpaceId, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    space_id: defaultSpaceId || "",
    noise_level: "quiet",
    crowding: "some",
    outlets_available: "yes",
    notes: "",
  });
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (defaultSpaceId) {
      setForm((prev) => ({ ...prev, space_id: defaultSpaceId }));
    }
  }, [defaultSpaceId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.space_id) {
      setStatus({ type: "error", message: "Select a study space." });
      return;
    }
    const success = await onSubmit(form);
    if (success) {
      setStatus({ type: "success", message: "Thanks for keeping StudySpaces fresh!" });
      setForm((prev) => ({ ...prev, notes: "" }));
    } else {
      setStatus({ type: "error", message: "Something went wrong. Try again." });
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-slate-600">Where are you?</label>
        <select
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          value={form.space_id}
          onChange={(event) => {
            const value = event.target.value;
            handleChange("space_id", value ? Number(value) : "");
          }}
        >
          <option value="">Select a space</option>
          {spaces.map((space) => (
            <option key={space.id} value={space.id}>
              {space.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4">
        <fieldset>
          <legend className="text-sm font-medium text-slate-600">Noise level</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {noiseOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => handleChange("noise_level", option.value)}
                className={`rounded-xl border px-2 py-2 text-sm ${form.noise_level === option.value ? "border-sky-500 bg-sky-50 text-sky-600" : "border-slate-200 text-slate-600"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-slate-600">Crowding</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {crowdingOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => handleChange("crowding", option.value)}
                className={`rounded-xl border px-2 py-2 text-sm ${form.crowding === option.value ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-600"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-slate-600">Outlets</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {outletOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => handleChange("outlets_available", option.value)}
                className={`rounded-xl border px-2 py-2 text-sm ${form.outlets_available === option.value ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-600" htmlFor="notes">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          rows={3}
          value={form.notes}
          maxLength={500}
          onChange={(event) => handleChange("notes", event.target.value)}
          placeholder="Masks required? Windows open? Favorite snacks nearby?"
        />
      </div>

      {status && (
        <div
          className={`rounded-xl px-3 py-2 text-sm ${status.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}
        >
          {status.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? "Publishing…" : "Share Check-in"}
      </button>
    </form>
  );
}

export default CheckInForm;
