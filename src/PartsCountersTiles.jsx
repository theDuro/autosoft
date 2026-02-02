import React, { useEffect, useState } from "react";

const hostname = window.location.hostname;
const protocol = window.location.protocol;
const API_PORT = 5000;
const API_BASE = `${protocol}//${hostname}:${API_PORT}`;

const MACHINE_ID = 1;

const PartsCountersTiles = ({ onBack }) => {
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCounters = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/get_prts_counters?machine_id=${MACHINE_ID}`
      );
      if (res.ok) {
        const data = await res.json();
        setCounters(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounters();
    const interval = setInterval(fetchCounters, 3000);
    return () => clearInterval(interval);
  }, []);

  const getTileColor = (c) => {
    if (c.is_empty) return "#e63946";      // BRAK
    if (c.counter === -1) return "#f4a261"; // MAŁO
    return "#2a9d8f";                      // OK
  };

  const getStatusText = (c) => {
    if (c.is_empty) return "BRAK";
    if (c.counter === -1) return "MAŁO";
    return "OK";
  };

  return (
    <div style={{ padding: "20px", height: "100vh" }}>
      {loading && <p>Ładowanie...</p>}

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          height: "calc(100% - 50px)"
        }}
      >
        {counters.map((c) => (
          <div
            key={c.part_id}
            style={{
              backgroundColor: getTileColor(c),
              borderRadius: "12px",
              padding: "20px",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "60px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
            }}
          >
            {/* NAZWA */}
            <div style={{ fontSize: "18px", fontWeight: "bold" }}>
              {c.name}
            </div>

            {/* STATUS */}
            <div style={{ fontSize: "28px", fontWeight: "bold" }}>
              {getStatusText(c)}
            </div>

            {/* COUNTER */}
            {c.counter > 0 && (
              <div style={{ fontSize: "22px", fontWeight: "bold" }}>
                {c.counter}
              </div>
            )}

            {c.counter === -1 && (
              <div style={{ fontSize: "14px", opacity: 0.8 }}>
                niski stan
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartsCountersTiles;
