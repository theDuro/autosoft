import React, { useEffect, useState, useMemo } from "react";
import "./MachineErrors.css";
import PartsCountersTiles from "./PartsCountersTiles";

import WILK2 from "./WILK2.png";

const hostname = window.location.hostname;
const protocol = window.location.protocol;
const API_BASE = `${protocol}//${hostname}:5000`;

const blinkStyle = `
  @keyframes blink {
    0%   { opacity: 1; }
    50%  { opacity: 0; }
    100% { opacity: 1; }
  }
  .blink-brak {
    animation: blink 0.8s step-start infinite;
  }
`;

const MachineErrorsWilk = ({ machineId }) => {
  const [config, setConfig] = useState([]);
  const [counters, setCounters] = useState([]);
  const [errorsMap, setErrorsMap] = useState({});
  const [selectedPart, setSelectedPart] = useState(null);
  const [partErrors, setPartErrors] = useState([]);
  const [partLoading, setPartLoading] = useState(false);
  const [partError, setPartError] = useState(null);
  const [lastErrors, setLastErrors] = useState([]);
  const [showErrorChart, setShowErrorChart] = useState(false);
  const [showPartsTiles, setShowPartsTiles] = useState(false);
  const [showStatusFields, setShowStatusFields] = useState(false);

   const [partsPositions] = useState([
    { partId: 1,  x: 83, y: 70, name: "Part 1"  },
    { partId: 2,  x: 81, y: 55, name: "Part 2"  },
    { partId: 3,  x: 80, y: 43, name: "Part 3"  },
    { partId: 4,  x: 78, y: 36, name: "Part 4"  },
    { partId: 5,  x: 76, y: 30, name: "Part 5"  },
    { partId: 6,  x: 74, y: 20, name: "Part 6"  },
    { partId: 7,  x: 66, y: 20, name: "Part 7"  },
    { partId: 8,  x: 63, y: 13, name: "Part 8"  },
    { partId: 9,  x: 56, y: 13, name: "Part 9"  },
    { partId: 10, x: 50, y: 13, name: "Part 10" },
    { partId: 11, x: 43, y: 13, name: "Part 11" },
    { partId: 12, x: 32, y: 20, name: "Part 12" },
    { partId: 13, x: 25, y: 26, name: "Part 13" },
    { partId: 14, x: 20, y: 16, name: "Part 14" },
    { partId: 15, x: 22, y: 36, name: "Part 15" },
    { partId: 16, x: 30, y: 36, name: "Part 16" },
    { partId: 17, x: 35, y: 36, name: "Part 17" },
    { partId: 18, x: 20, y: 46, name: "Part 18" },
    { partId: 19, x: 28, y: 46, name: "Part 19" },
    { partId: 20, x: 35, y: 46, name: "Part 20" },
    { partId: 21, x: 20, y: 58, name: "Part 21" },
    { partId: 22, x: 27, y: 58, name: "Part 22" },
    { partId: 23, x: 34, y: 58, name: "Part 23" },
    { partId: 24, x: 20, y: 69, name: "Part 24" },
    { partId: 25, x: 27, y: 69, name: "Part 25" },
    { partId: 26, x: 35, y: 69, name: "Part 26" },
    { partId: 27, x: 43, y: 85, name: "Part 27" },
    { partId: 28, x: 52, y: 75, name: "Part 28" },
    { partId: 29, x: 60, y: 75, name: "Part 29" },
    { partId: 30, x: 50, y: 60, name: "Part 30" },
    { partId: 31, x: 60, y: 60, name: "Part 31" },
    { partId: 32, x: 52, y: 43, name: "Part 32" },
    { partId: 33, x: 62, y: 43, name: "Part 33" },
    { partId: 34, x: 50, y: 30, name: "Part 34" },
    { partId: 35, x: 58, y: 30, name: "Part 35" },
    { partId: 36, x: 50, y: 20, name: "Part 36" },
    { partId: 37, x: 58, y: 20, name: "Part 37" },
  ]);


  const getDateFrom = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - 1);
    return d.toISOString();
  };

  useEffect(() => {
    if (!machineId) return;
    fetch(`${API_BASE}/api/get_machine_parts_by_machine_id/${machineId}`)
      .then(r => r.json())
      .then(d => setConfig(Array.isArray(d) ? d : []));
  }, [machineId]);

  const fetchCounters = async () => {
    if (!machineId) return;
    try {
      const r = await fetch(`${API_BASE}/api/get_prts_counters?machine_id=${machineId}`);
      if (r.ok) {
        const d = await r.json();
        setCounters(Array.isArray(d) ? d : []);
      }
    } catch (e) { console.error(e); }
  };

  const fetchErrors = async () => {
    if (!config.length) return;
    const dateFrom = getDateFrom();
    const entries = await Promise.all(
      config.map(async p => {
        const url = `${API_BASE}/api/get_error_str?part_id=${encodeURIComponent(p.id)}&date_from=${encodeURIComponent(dateFrom)}`;
        try {
          const r = await fetch(url);
          const d = await r.json();
          if (Array.isArray(d)) return [p.id, d.map(String)];
          if (d?.error)         return [p.id, [String(d.error)]];
          return [p.id, [String(d)]];
        } catch (e) {
          return [p.id, [e?.message ?? String(e)]];
        }
      })
    );
    setErrorsMap(Object.fromEntries(entries));
  };

  const fetchLastErrors = async () => {
    if (!machineId) return;
    try {
      const r = await fetch(`${API_BASE}/api/get_last_errors/${machineId}`);
      if (r.ok) {
        const d = await r.json();
        setLastErrors(Array.isArray(d) ? d : []);
      }
    } catch (e) { console.error(e); }
  };

  const fetchPartErrors = async (partId) => {
    setPartLoading(true);
    setPartError(null);
    const dateFrom = getDateFrom();
    try {
      const r = await fetch(
        `${API_BASE}/api/get_error_for_parts?part_id=${partId}&date_from=${encodeURIComponent(dateFrom)}`
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setPartErrors(Array.isArray(d) ? d : []);
    } catch (e) {
      setPartError(e?.message ?? String(e));
      setPartErrors([]);
    } finally {
      setPartLoading(false);
    }
  };

  useEffect(() => {
    if (!config.length || !machineId) return;
    fetchErrors();
    fetchCounters();
    fetchLastErrors();
    const interval = setInterval(() => {
      fetchErrors();
      fetchCounters();
      fetchLastErrors();
    }, 3000);
    return () => clearInterval(interval);
  }, [config, machineId]);

  const counterMap = useMemo(
    () => Object.fromEntries(counters.map(c => [c.part_id, c])),
    [counters]
  );

  if (showPartsTiles) {
    return (
      <div style={{ padding: 20 }}>
        <button onClick={() => setShowPartsTiles(false)} style={{ marginBottom: 10 }}>
          ← Powrót
        </button>
        <PartsCountersTiles machineId={machineId} apiBase={API_BASE} />
      </div>
    );
  }

  if (showErrorChart) {
    return (
      <div style={{ padding: 20 }}>
        <button onClick={() => setShowErrorChart(false)}>← Powrót</button>
      </div>
    );
  }

  if (selectedPart) {
    return (
      <div style={{ padding: 20 }}>
        <button onClick={() => setSelectedPart(null)} style={{ marginBottom: 10 }}>← Powrót</button>
        <h2>Błędy dla części: {selectedPart.name} (ostatnia minuta)</h2>
        {partLoading && <p>Ładowanie...</p>}
        {partError   && <p style={{ color: "red" }}>{partError}</p>}
        {!partLoading && !partError && partErrors.length === 0 && <p>Brak błędów</p>}
        {!partLoading && !partError && partErrors.length > 0 && (
          <table border="1" cellPadding="5" style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th>ID błędu</th>
                <th>Kod błędu</th>
                <th>Opis</th>
                <th>Wystąpienie</th>
              </tr>
            </thead>
            <tbody>
              {partErrors.map(e => (
                <tr key={e.id}>
                  <td>{e.error_id}</td>
                  <td>{e.error_code}</td>
                  <td>{e.description}</td>
                  <td>{new Date(e.occurred_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#2c2c2c" }}>

      <style>{blinkStyle}</style>

      {/* PASEK GÓRNY - pomarańczowe przyciski z cieniem */}
      <div style={{ 
        display: "flex", 
        gap: 10, 
        padding: 10, 
        alignItems: "center",
        backgroundColor: "#1a1a1a",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
      }}>
       
        
        <button 
          onClick={() => setShowPartsTiles(true)}
          style={{
            backgroundColor: "#ff8c00",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
            transition: "all 0.2s"
          }}
          onMouseOver={e => e.target.style.backgroundColor = "#ffa500"}
          onMouseOut={e => e.target.style.backgroundColor = "#ff8c00"}
        >
          Kafelki części
        </button>
      </div>

      {/* PANEL OSTATNICH BŁĘDÓW */}
      <div style={{
        padding: "4px 10px",
        backgroundColor: "#1a1a2e",
        color: "#fff",
        fontSize: 11,
        maxHeight: 60,
        overflowY: "auto",
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
      }}>
        <strong style={{ whiteSpace: "nowrap" }}>Ostatnie błędy:</strong>
        {lastErrors.length === 0
          ? <span style={{ color: "#aaa" }}>Brak</span>
          : lastErrors.map(e => (
            <span key={e.id} style={{ color: "#ffa500", whiteSpace: "nowrap" }}>
              [{e.error_code}] {e.description} — {new Date(e.occurred_at).toLocaleString()}
            </span>
          ))
        }
      </div>

      {/* OBRAZ WILK */}
      <div style={{ position: "relative", width: "100%", height: "calc(100% - 100px)" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            width: "90%",
            height: "100%",
            background: `url(${WILK2}) center/contain no-repeat`,
          }}
        >
          {partsPositions.map(p => {
            const counter = counterMap[p.partId];
            const statusText = counter
              ? counter.counter === -1 ? "MAŁO" : counter.is_empty ? "BRAK" : "OK"
              : "";
            const statusColor = counter
              ? counter.counter === -1 ? "orange" : counter.is_empty ? "red" : "green"
              : "black";

            const errs     = errorsMap[p.partId] || [];
            const errsText = errs.join(", ");
            const isBrak   = counter && counter.is_empty;

            return (
              <button
                key={p.partId}
                className={isBrak ? "blink-brak" : ""}
                style={{
                  position: "absolute",
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "transparent",
                  border: "none",
                  boxShadow: "none",
                }}
                title={`${p.name}\nStatus: ${statusText}\nBłędy: ${errsText || "brak"}`}
                onClick={() => {
                  setSelectedPart(p);
                  fetchPartErrors(p.partId);
                }}
              >
                {statusText !== "" && (
                  <div style={{
                    color: statusColor,
                    fontWeight: "bold",
                    fontSize: 24,
                    textShadow: "0 0 4px #000, 0 0 4px #000",
                    lineHeight: 1,
                  }}>
                    {statusText}
                  </div>
                )}
                {errsText !== "" && (
                  <div style={{
                    color: "red",
                    fontSize: 16,
                    maxWidth: 80,
                    textAlign: "center",
                    wordBreak: "break-word",
                    textShadow: "0 0 3px #000",
                  }}>
                    {errsText}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MachineErrorsWilk;