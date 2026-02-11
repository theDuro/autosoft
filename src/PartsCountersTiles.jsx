import React, { useEffect, useState } from "react";

const hostname = window.location.hostname;
const protocol = window.location.protocol;
const API_PORT = 5000;
const API_BASE = `${protocol}//${hostname}:${API_PORT}`;
const MACHINE_ID = 1;

const blinkStyle = `
  @keyframes blink-malo {
    0%   { background-color: #ff8c00 !important; }
    50%  { background-color: #e63946 !important; }
    100% { background-color: #ff8c00 !important; }
  }
  .blink-malo-tile {
    animation: blink-malo 0.8s ease-in-out infinite !important;
  }
`;

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
    if (c.is_empty) return "#e63946";   // BRAK - czerwony
    // Dla MAŁO nie ustawiamy koloru tutaj - będzie z animacji
    if (c.counter === -1) return "transparent"; 
    return "#2a9d8f";                    // OK - zielony
  };

  const getStatusText = (c) => {
    if (c.is_empty) return "BRAK";
    if (c.counter === -1) return "MAŁO";
    return "OK";
  };

  return (
    <div style={{ 
      padding: 0,
      margin: 0,
      minHeight: "100vh",
      width: "100vw",
      backgroundColor: "#2c2c2c",
      boxSizing: "border-box"
    }}>
      <style>{blinkStyle}</style>

      {/* CONTAINER */}
      <div style={{ padding: "20px" }}>
        {/* PRZYCISK POWRÓT */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              backgroundColor: "#ff8c00",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
              marginBottom: "16px",
              transition: "all 0.2s"
            }}
            onMouseOver={e => e.target.style.backgroundColor = "#ffa500"}
            onMouseOut={e => e.target.style.backgroundColor = "#ff8c00"}
          >
            ← Powrót
          </button>
        )}

        {loading && <p style={{ color: "#fff" }}>Ładowanie...</p>}

        {/* GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px"
          }}
        >
          {counters.map((c) => {
            const isMalo = c.counter === -1;
            return (
              <div
                key={c.part_id}
                className={isMalo ? "blink-malo-tile" : ""}
                style={{
                  backgroundColor: isMalo ? "#ff8c00" : getTileColor(c),
                  borderRadius: "12px",
                  padding: "20px",
                  color: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "120px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
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
                  <div style={{ fontSize: "14px", opacity: 0.9, fontWeight: "bold" }}>
                    ⚠️ NISKI STAN
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PartsCountersTiles;