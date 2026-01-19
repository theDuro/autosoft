import React, { useEffect, useState, useMemo } from "react";
import "./MachineErrors.css";
const hostname = window.location.hostname;
const protocol = window.location.protocol;
// Backend w Dockerze u znajomego jest wystawiony na hoście na porcie 5000
const API_PORT = 5000;
const API_BASE = `${protocol}//${hostname}:${API_PORT}`;

const timeOptions = [
  { label: "Ostatnia minuta", value: "1m" },
  { label: "Ostatnie 10 min", value: "10m" },
  { label: "Ostatnia godzina", value: "1h" },
];

const MachineConfig = ({ machineId }) => {
  const [config, setConfig] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorsMap, setErrorsMap] = useState({});
  const [counters, setCounters] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [partErrors, setPartErrors] = useState([]);
  const [partLoading, setPartLoading] = useState(false);
  const [partError, setPartError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState("1h");
  const [lastErrors, setLastErrors] = useState([]);
  const [selectedPartId, setSelectedPartId] = useState(null);

  const getDateFrom = () => {
    const now = new Date();
    let from = new Date();
    switch (selectedTimeRange) {
      case "1m": from.setMinutes(now.getMinutes() - 1); break;
      case "10m": from.setMinutes(now.getMinutes() - 10); break;
      case "1h": from.setHours(now.getHours() - 1); break;
      default: from = now;
    }
    return from.toISOString();
  };

  // --- Fetch parts ---
  useEffect(() => {
    if (!machineId) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/get_machine_parts_by_machine_id/${machineId}`)
      .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
      .then(data => setConfig(Array.isArray(data) ? data : []))
      .catch(err => setError(err?.message ?? String(err)))
      .finally(() => setLoading(false));
  }, [machineId]);

  // --- Fetch counters ---
  const fetchCounters = async () => {
    if (!machineId) return;
    try {
      const res = await fetch(`${API_BASE}/api/get_prts_counters?machine_id=${machineId}`);
      if (res.ok) {
        const data = await res.json();
        setCounters(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); }
  };

  // --- Fetch errors for all parts ---
  const fetchErrors = async () => {
    if (!config || config.length === 0) {
      setErrorsMap({});
      return;
    }
    const dateFrom = getDateFrom();
    const entries = await Promise.all(
      config.map(async (item) => {
        const url = `${API_BASE}/api/get_error_str?part_id=${encodeURIComponent(item.id)}&date_from=${encodeURIComponent(dateFrom)}`;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            const txt = await res.text();
            return [item.id, [`HTTP ${res.status}: ${txt}`]];
          }
          const data = await res.json();
          if (Array.isArray(data)) return [item.id, data.map(d => String(d))];
          if (data && data.error) return [item.id, [String(data.error)]];
          return [item.id, [String(data)]];
        } catch (err) {
          return [item.id, [err?.message ?? String(err)]];
        }
      })
    );
    setErrorsMap(Object.fromEntries(entries));
  };

  // --- Fetch errors for a single part ---
  const fetchPartErrors = async (partId) => {
    setPartLoading(true);
    setPartError(null);
    const dateFrom = getDateFrom();
    try {
      const res = await fetch(`${API_BASE}/api/get_error_for_parts?part_id=${partId}&date_from=${encodeURIComponent(dateFrom)}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }
      const data = await res.json();
      setPartErrors(Array.isArray(data) ? data : []);
    } catch (err) {
      setPartError(err?.message ?? String(err));
      setPartErrors([]);
    } finally {
      setPartLoading(false);
    }
  };

  // --- Fetch last errors ---
  const fetchLastErrors = async () => {
    if (!machineId) return;
    try {
      const url = `${API_BASE}/api/get_last_errors/${machineId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLastErrors(Array.isArray(data) ? data : []);
      } else {
        console.warn("get_last_errors failed", res.status);
      }
    } catch (err) { console.error(err); }
  };

  // --- Refresh every 3 seconds ---
  useEffect(() => {
    if (!config || config.length === 0 || !machineId) return;
    fetchErrors();
    fetchCounters();
    fetchLastErrors();

    const intervalId = setInterval(() => {
      fetchErrors();
      fetchCounters();
      fetchLastErrors();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [config, selectedTimeRange, machineId]);

  const counterMap = useMemo(() => Object.fromEntries(counters.map(c => [c.part_id, c])), [counters]);
  const filteredLastErrors = selectedPartId
    ? lastErrors.filter(e => e.part_id === selectedPartId)
    : lastErrors;

  if (!machineId) return null;
  if (loading) return <p>Ładowanie konfiguracji maszyny...</p>;
  if (error) return <p style={{ color: "red" }}>{String(error)}</p>;

  // --- Selected part view ---
  if (selectedPart) {
    return (
      <div style={{ padding: "20px" }}>
        <button onClick={() => setSelectedPart(null)} style={{ marginBottom: "10px" }}>← Powrót</button>
        <h2>
          Błędy dla części {selectedPart.name} w zakresie {timeOptions.find(o => o.value === selectedTimeRange)?.label}
        </h2>
        {partLoading && <p>Ładowanie...</p>}
        {partError && <p style={{ color: "red" }}>{String(partError)}</p>}
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

  // --- Main machine view ---
  return (
    <div style={{ position: "relative" }}>
      {/* Dropdown */}
      <div style={{ marginTop: "10px", marginBottom: 10 }}>
        <label>Wybierz zakres czasu: </label>
        <select value={selectedTimeRange} onChange={e => setSelectedTimeRange(e.target.value)}>
          {timeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Counter tiles */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        padding: "5px 0",
        zIndex: 10,
        position: "relative"
      }}>
        {counters.filter(c => c.counter !== 0).map(c => (
          <div key={c.part_id} style={{
            padding: "3px 6px",
            borderRadius: "4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
            backgroundColor: "#faa307",
          }}>
            <div style={{ fontWeight: "bold", color: "#000", fontSize: "10px" }}>{c.name}</div>
            <div style={{ fontWeight: "bold", color: "blue", fontSize: "11px" }}>{c.counter}</div>
            <div style={{
              fontWeight: "bold",
              color: c.counter === -1 ? "orange" : c.is_empty ? "red" : "green",
              fontSize: "10px"
            }}>
              {c.counter === -1 ? "MAŁO" : c.is_empty ? "BRAK" : "OK"}
            </div>
          </div>
        ))}
      </div>

      {/* Machine board */}
      <div className="machine-config-board" style={{ position: "relative", width: "100%", height: "500px" }}>
        {config.map(item => {
          const errs = errorsMap[item.id] || [];
          const errsText = errs.length > 0 ? errs.join(", ") : "";
          const counterData = counterMap[item.id];
          const statusText = counterData
            ? counterData.counter === -1 ? "MAŁO" : counterData.is_empty ? "BRAK" : "OK"
            : "";
          const statusColor = counterData
            ? counterData.counter === -1 ? "orange" : counterData.is_empty ? "red" : "green"
            : "black";

          return (
            <button
              key={item.id}
              className="machine-button"
              title={`Status: ${statusText}`}
              style={{
                position: "absolute",
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                fontSize: "12px",
                lineHeight: "1.2",
                whiteSpace: "normal",
                padding: "6px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                minWidth: "50px",
              }}
              onClick={() => {
                setSelectedPart(item);
                fetchPartErrors(item.id);
              }}
            >
              {counterData && (
                <div style={{
                  color: statusColor,
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "2px",
                }}>
                  {statusText}
                </div>
              )}
              {errsText && (
                <div style={{
                  color: "red",
                  fontSize: "8px",
                  marginTop: "2px",
                  maxWidth: "80px",
                  textAlign: "center",
                  wordBreak: "break-word",
                }}>
                  {errsText}
                </div>
              )}
            </button>
          );
        })}

        {/* Last errors panel */}
        <div style={{
          position: "absolute",
          bottom: "320px",
          left: "0px",
          right: "0px",
          backgroundColor: "transparent",
          color: "#fbf3f3ff",
          padding: "4px 6px",
          fontSize: "10px",
          zIndex: 3,
        }}>
          <strong>Ostatnie błędy {selectedPartId ? `(część ${selectedPartId})` : ""}</strong>
          <ul style={{ margin: 0, paddingLeft: "18px" }}>
            {filteredLastErrors.map(e => (
              <li key={e.id} style={{ marginBottom: "6px" }}>
                <span style={{ fontWeight: "bold" }}>{e.error_code}</span>: {e.description} <br />
                <span style={{ fontSize: "15px", color: "#fbf3f3ff", fontWeight: "500" }}>
                  {new Date(e.occurred_at).toLocaleString()}
                </span>
              </li>
            ))}
            {filteredLastErrors.length === 0 && <li>Brak błędów</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MachineConfig;
