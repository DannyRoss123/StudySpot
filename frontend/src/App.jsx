import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HomePage from "./components/HomePage.jsx";
import SpaceDetail from "./components/SpaceDetail.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CROWDING_ORDER = { empty: 0, some: 1, full: 2 };
const NOISE_ORDER = { quiet: 0, moderate: 1, loud: 2 };

const defaultFilters = {
  quietOnly: false,
  outletsOnly: false,
  recentOnly: false,
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  if ([lat1, lon1, lat2, lon2].some((coord) => coord == null)) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  return +(distanceKm * 0.621371).toFixed(2); // miles
};

function App() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [sortBy, setSortBy] = useState("lastUpdated");
  const [selectedSpaceId, setSelectedSpaceId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [geoCoords, setGeoCoords] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const formRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("studyspaces_user_id");
    if (stored) {
      setUserId(stored);
      return;
    }
    const randomId =
      typeof window !== "undefined" && window.crypto?.randomUUID
        ? `web-${window.crypto.randomUUID().split("-")[0]}`
        : `web-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem("studyspaces_user_id", randomId);
    setUserId(randomId);
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setGeoCoords({ lat: coords.latitude, lon: coords.longitude });
      },
      () => {
        // Ignore errors; the UI will simply hide distance sorting.
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/spaces`);
      if (!response.ok) {
        throw new Error("Unable to load study spaces");
      }
      const payload = await response.json();
      setSpaces(payload);
      if (!selectedSpaceId && payload.length > 0) {
        setSelectedSpaceId(payload[0].id);
      }
      setLastRefreshedAt(new Date());
      setRefreshToken((token) => token + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedSpaceId]);

  useEffect(() => {
    fetchSpaces();
    const interval = setInterval(fetchSpaces, 30000);
    return () => clearInterval(interval);
  }, [fetchSpaces]);

  const spacesWithDistance = useMemo(() => {
    return spaces.map((space) => ({
      ...space,
      distance: geoCoords ? haversineDistance(geoCoords.lat, geoCoords.lon, space.latitude, space.longitude) : null,
    }));
  }, [spaces, geoCoords]);

  const filteredSpaces = useMemo(() => {
    return spacesWithDistance.filter((space) => {
      const quietPass = !filters.quietOnly || space.recent_noise_level === "quiet";
      const outletsPass =
        !filters.outletsOnly || ["yes", "some"].includes(space.recent_outlets || "");
      const recentPass = !filters.recentOnly || (space.last_updated_minutes ?? Infinity) <= 60;
      return quietPass && outletsPass && recentPass;
    });
  }, [spacesWithDistance, filters]);

  const sortedSpaces = useMemo(() => {
    const clone = [...filteredSpaces];
    clone.sort((a, b) => {
      switch (sortBy) {
        case "distance": {
          const da = a.distance ?? Infinity;
          const db = b.distance ?? Infinity;
          return da - db;
        }
        case "crowding": {
          const ca = CROWDING_ORDER[a.recent_crowding] ?? Infinity;
          const cb = CROWDING_ORDER[b.recent_crowding] ?? Infinity;
          return ca - cb;
        }
        case "noise": {
          const na = NOISE_ORDER[a.recent_noise_level] ?? Infinity;
          const nb = NOISE_ORDER[b.recent_noise_level] ?? Infinity;
          return na - nb;
        }
        case "lastUpdated":
        default: {
          const la = a.last_updated_minutes ?? Infinity;
          const lb = b.last_updated_minutes ?? Infinity;
          return la - lb;
        }
      }
    });
    return clone;
  }, [filteredSpaces, sortBy]);

  const selectedSpaceSummary = useMemo(
    () => sortedSpaces.find((space) => space.id === selectedSpaceId) || spacesWithDistance.find((space) => space.id === selectedSpaceId),
    [sortedSpaces, spacesWithDistance, selectedSpaceId]
  );

  const handleSubmitCheckIn = useCallback(
    async (formValues) => {
      setIsSubmitting(true);
      try {
        const response = await fetch(`${API_URL}/check-in`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...formValues, user_id: userId }),
        });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.detail || "Unable to submit check-in");
        }
        await fetchSpaces();
        return true;
      } catch (err) {
        console.error(err);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [userId, fetchSpaces]
  );

  const scrollToCheckIn = useCallback(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <HomePage
        spaces={sortedSpaces}
        filters={filters}
        onFilterChange={setFilters}
        sortBy={sortBy}
        onSortChange={setSortBy}
        loading={loading}
        error={error}
        onSelectSpace={setSelectedSpaceId}
        selectedSpaceId={selectedSpaceId}
        onSubmitCheckIn={handleSubmitCheckIn}
        isSubmitting={isSubmitting}
        formRef={formRef}
        lastRefreshedAt={lastRefreshedAt}
        geoCoords={geoCoords}
      />
      <SpaceDetail
        spaceId={selectedSpaceId}
        apiUrl={API_URL}
        summary={selectedSpaceSummary}
        refreshToken={refreshToken}
        onRequestCheckIn={scrollToCheckIn}
      />
    </div>
  );
}

export default App;
