import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const CROWDING_POINTS = { empty: 1, some: 2, full: 3 };
const CROWDING_LABELS = { 1: "Empty", 2: "Some", 3: "Full" };

const minuteCopy = (minutes) => {
  if (minutes == null) return "No recent updates";
  if (minutes < 1) return "Updated just now";
  if (minutes === 1) return "Updated 1 min ago";
  return `Updated ${minutes} mins ago`;
};

function SpaceDetail({ spaceId, apiUrl, summary, refreshToken, onRequestCheckIn }) {
  const [detail, setDetail] = useState(null);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!spaceId) {
      setDetail(null);
      setRecentCheckins([]);
    }
  }, [spaceId]);

  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const [detailRes, recentRes] = await Promise.all([
          fetch(`${apiUrl}/spaces/${spaceId}`),
          fetch(`${apiUrl}/spaces/${spaceId}/recent-checkins`),
        ]);
        if (!detailRes.ok) {
          throw new Error("Unable to load space detail");
        }
        const detailPayload = await detailRes.json();
        const recentPayload = recentRes.ok ? await recentRes.json() : [];
        if (!cancelled) {
          setDetail(detailPayload.space);
          setRecentCheckins(recentPayload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [spaceId, apiUrl, refreshToken]);

  const activeSpace = detail || summary;

  const trendData = useMemo(() => {
    return recentCheckins
      .slice()
      .reverse()
      .map((checkin) => {
        const point = CROWDING_POINTS[checkin.crowding];
        if (!point) return null;
        return {
          label: new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(checkin.timestamp)),
          crowding: point,
        };
      })
      .filter(Boolean);
  }, [recentCheckins]);

  if (!spaceId) {
    return (
      <section className="mx-auto mt-8 max-w-6xl px-4 lg:px-0">
        <div className="rounded-2xl bg-white p-6 text-center shadow-lg">
          <p className="text-sm text-slate-500">Select a study space to see live details.</p>
        </div>
      </section>
    );
  }

  if (loading && !activeSpace) {
    return (
      <section className="mx-auto mt-8 max-w-6xl px-4 lg:px-0">
        <div className="rounded-2xl bg-white p-6 text-center shadow-lg">
          <p className="text-sm text-slate-500">Loading space details…</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto mt-8 max-w-6xl px-4 lg:px-0">
        <div className="rounded-2xl bg-white p-6 text-center shadow-lg">
          <p className="text-sm text-rose-500">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-8 max-w-6xl px-4 pb-10 lg:px-0">
      <div className="rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-400">Space detail</p>
            <h2 className="text-2xl font-semibold text-slate-900">{activeSpace?.name}</h2>
            <p className="text-sm text-slate-500">
              {activeSpace?.building} • Floor {activeSpace?.floor || "--"}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onRequestCheckIn}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Check in here
            </button>
            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-600">
              {minuteCopy(activeSpace?.last_updated_minutes)}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 text-sm text-slate-600 lg:grid-cols-3">
          <div className="rounded-2xl bg-sky-50 p-4">
            <p className="text-xs uppercase tracking-wide text-sky-700">Noise</p>
            <p className="text-lg font-semibold text-sky-900">{activeSpace?.recent_noise_level || "--"}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-700">Crowding</p>
            <p className="text-lg font-semibold text-amber-900">{activeSpace?.recent_crowding || "--"}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Outlets</p>
            <p className="text-lg font-semibold text-emerald-900">{activeSpace?.recent_outlets || "--"}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Occupancy trend (last 10 check-ins)</h3>
            {trendData.length ? (
              <div className="mt-3 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <YAxis
                      type="number"
                      domain={[1, 3]}
                      ticks={[1, 2, 3]}
                      tickFormatter={(value) => CROWDING_LABELS[value]}
                      stroke="#94a3b8"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => CROWDING_LABELS[value]}
                      labelFormatter={(label) => `Reported at ${label}`}
                    />
                    <Line type="monotone" dataKey="crowding" stroke="#0ea5e9" strokeWidth={3} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No trend data yet.</p>
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Recent check-ins</h3>
            <ul className="mt-3 flex flex-col gap-3">
              {recentCheckins.slice(0, 10).map((checkin) => (
                <li key={checkin.id} className="rounded-2xl border border-slate-100 px-3 py-2 text-sm text-slate-600">
                  <p className="font-medium text-slate-900">
                    {new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(checkin.timestamp))}
                  </p>
                  <p>
                    Noise: {checkin.noise_level} • Crowding: {checkin.crowding} • Outlets: {checkin.outlets_available}
                  </p>
                  {checkin.notes && <p className="text-slate-500">{checkin.notes}</p>}
                </li>
              ))}
              {!recentCheckins.length && (
                <li className="rounded-2xl border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500">
                  No check-ins yet. Be the first!
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SpaceDetail;
