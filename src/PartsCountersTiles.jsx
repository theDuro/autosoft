import React, { useEffect, useState } from "react";

const hostname = window.location.hostname;
const protocol = window.location.protocol;
const API_PORT = 5000;
const API_BASE = `${protocol}//${hostname}:${API_PORT}`;
const MACHINE_ID = 1;

const blinkStyle = `
  @keyframes blink-brak {
    0%   { background-color: red; }
    50%  { background-color: white; }
    100% { background-color: red; }
  }
  @keyframes blink-malo {
    0%   { background-color: #ff8c00; }
    50%  { background-color: white; }
    100% { background-color: #ff8c00; }
  }
  .blink-brak-tile {
    animation: blink-brak 0.8s step-start infinite;
  }
  .blink-malo-tile {
    animation: blink-malo 0.8s step-start infinite;
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
    if (c.is_empty) return "red";        // BRAK - czerwony (mruga do białego)
    if (c.counter === -1) return "#ff8c00"; // MAŁO - pomarańczowy (mruga do białego)
    return "#2a9d8f";                    // OK - zielony
  };

  const getStatusText = (c) => {
    if (c.is_empty) return "BRAK";
    if (c.counter === -1) return "MAŁO";
    return "OK";
  };

  const getStatusColor = (c) => {
    if (c.is_empty) return "red";
    if (c.counter === -1) return "orange";
    return "green";
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
              padding: "12px 24px",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
              marginBottom: "20px",
              transition: "all 0.2s",
              fontSize: "18px"
            }}
            onMouseOver={e => e.target.style.backgroundColor = "#ffa500"}
            onMouseOut={e => e.target.style.backgroundColor = "#ff8c00"}
          >
            ← Powrót
          </button>
        )}

        {loading && <p style={{ color: "#fff", fontSize: "20px" }}>Ładowanie...</p>}

        {/* GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px"
          }}
        >
          {counters.map((c) => {
            const isBrak = c.is_empty;
            const isMalo = c.counter === -1;
            
            return (
              <div
                key={c.part_id}
                className={isBrak ? "blink-brak-tile" : isMalo ? "blink-malo-tile" : ""}
                style={{
                  backgroundColor: getTileColor(c),
                  borderRadius: "8px",
                  padding: "12px",
                  color: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "90px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
                }}
              >
                {/* NAZWA */}
                <div style={{ 
                  fontSize: "11px", 
                  fontWeight: "bold",
                  textShadow: "0 0 4px #000"
                }}>
                  {c.name}
                </div>

                {/* STATUS - 2x większy napis */}
                <div style={{ 
                  fontSize: "64px", 
                  fontWeight: "bold",
                  color: getStatusColor(c),
                  textShadow: "0 0 8px #000, 0 0 8px #000, 0 0 10px #000",
                  lineHeight: 1,
                  textAlign: "center",
                  margin: "5px 0"
                }}>
                  {getStatusText(c)}
                </div>

                {/* COUNTER */}
                {c.counter > 0 && (
                  <div style={{ 
                    fontSize: "16px", 
                    fontWeight: "bold",
                    textAlign: "center",
                    textShadow: "0 0 4px #000"
                  }}>
                    Ilość: {c.counter}
                  </div>
                )}
                {c.counter === -1 && (
                  <div style={{ 
                    fontSize: "10px", 
                    opacity: 0.95, 
                    fontWeight: "bold",
                    textAlign: "center",
                    textShadow: "0 0 4px #000"
                  }}>
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