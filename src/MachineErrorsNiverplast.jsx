import React, { useEffect, useState, useMemo } from "react";
import "./MachineErrors.css";
import PartsCountersTiles from "./PartsCountersTiles";

import Niverplast from "./Niverplast.png";

const hostname = window.location.hostname;
const protocol = window.location.protocol;
const API_BASE = `${protocol}//${hostname}:5000`;

const blinkStyle = `
  @keyframes blink {
    0%   { background-color: red; }
    50%  { background-color: white; }
    100% { background-color: red; }
  }
  .blink-brak {
    animation: blink 0.8s step-start infinite;
  }
`;

const MachineErrorsNiverplast = ({ machineId }) => {
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
    { partId: 38, x: 50, y: 30, name: "Part 38" },
    { partId: 39, x: 45, y: 50, name: "Part 39" },
    { partId: 40, x: 17, y: 73, name: "Part 40" },
    { partId: 41, x: 17, y: 30, name: "Part 41" },
    { partId: 42, x: 80, y: 30, name: "Part 42" },
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

      {/* OBRAZ NIVERPLAST */}
      <div style={{
        position: "relative",
        width: "100%",
        height: "calc(100% - 100px)",
        background: `url(${Niverplast}) center/contain no-repeat`,
      }}>
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
                padding: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: isBrak ? "red" : "transparent",
                border: "none",
                borderRadius: "6px",
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
                  fontSize: 144,
                  textShadow: "0 0 12px #000, 0 0 12px #000, 0 0 15px #000, 0 0 20px #000",
                  lineHeight: 1,
                }}>
                  {statusText}
                </div>
              )}
              {errsText !== "" && (
                <div style={{
                  color: "red",
                  fontSize: 96,
                  maxWidth: 400,
                  textAlign: "center",
                  wordBreak: "break-word",
                  textShadow: "0 0 10px #000, 0 0 10px #000, 0 0 12px #000",
                }}>
                  {errsText}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MachineErrorsNiverplast;