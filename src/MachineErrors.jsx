import React, { useEffect, useState } from "react";
import "./MachineErrors.css";

const API_BASE =
  "https://autosoftv2-h4eeh8emg3dzceds.germanywestcentral-01.azurewebsites.net/";

const timeOptions = [
  { label: "Ostatnia godzina", value: "1h" },
  { label: "Ostatnie 2 godziny", value: "2h" },
  { label: "Ostatnie 3 godziny", value: "3h" },
  { label: "Ostatni dzień", value: "1d" },
  { label: "Ostatnie 2 dni", value: "2d" },
  { label: "Ostatni tydzień", value: "7d" },
  { label: "Ostatni miesiąc", value: "30d" },
];

const MachineConfig = ({ machineId }) => {
  const [config, setConfig] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorsMap, setErrorsMap] = useState({});
  const [countersMap, setCountersMap] = useState({});
  const [selectedPart, setSelectedPart] = useState(null);
  const [partErrors, setPartErrors] = useState([]);
  const [partLoading, setPartLoading] = useState(false);
  const [partError, setPartError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState("1h");

  const getDateFrom = () => {
    const now = new Date();
    let from = new Date();
    switch (selectedTimeRange) {
      case "1h":
        from.setHours(now.getHours() - 1);
        break;
      case "2h":
        from.setHours(now.getHours() - 2);
        break;
      case "3h":
        from.setHours(now.getHours() - 3);
        break;
      case "1d":
        from.setDate(now.getDate() - 1);
        break;
      case "2d":
        from.setDate(now.getDate() - 2);
        break;
      case "7d":
        from.setDate(now.getDate() - 7);
        break;
      case "30d":
        from.setDate(now.getDate() - 30);
        break;
      default:
        from = now;
    }
    return from.toISOString();
  };

  useEffect(() => {
    if (!machineId) return;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/get_machine_parts_by_machine_id/${machineId}`)
      .then((res) => {
        if (!res.ok)
          return res
            .text()
            .then((t) => Promise.reject(new Error(`HTTP ${res.status}: ${t}`)));
        return res.json();
      })
      .then((data) => setConfig(Array.isArray(data) ? data : []))
      .catch((err) => setError(err?.message ?? String(err)))
      .finally(() => setLoading(false));
  }, [machineId]);

  const fetchErrors = async () => {
    if (!config || config.length === 0) {
      setErrorsMap({});
      return;
    }
    const dateFrom = getDateFrom();
    const entries = await Promise.all(
      config.map(async (item) => {
        const url = `${API_BASE}/api/get_error_ids?part_id=${encodeURIComponent(
          item.id
        )}&date_from=${encodeURIComponent(dateFrom)}`;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            const txt = await res.text();
            return [item.id, [`HTTP ${res.status}: ${txt}`]];
          }
          const data = await res.json();
          if (Array.isArray(data)) return [item.id, data.map((d) => String(d))];
          if (data && data.error) return [item.id, [String(data.error)]];
          return [item.id, [String(data)]];
        } catch (err) {
          return [item.id, [err?.message ?? String(err)]];
        }
      })
    );
    setErrorsMap(Object.fromEntries(entries));
  };

  const fetchCounters = async () => {
    if (!machineId) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/get_prts_counters?machine_id=${machineId}`
      );
      if (!res.ok) {
        console.error("Błąd pobierania liczników:", res.status);
        return;
      }
      const data = await res.json();
      const map = {};
      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (item.part_id) {
            map[item.part_id] = {
              counter: item.counter,
              is_empty: item.is_empty,
              name: item.name,
            };
          }
        });
      }
      setCountersMap(map);
    } catch (err) {
      console.error("Błąd pobierania liczników:", err);
    }
  };

  useEffect(() => {
    if (!config || config.length === 0) return;
    fetchErrors();
    fetchCounters();
    const intervalId = setInterval(() => {
      fetchErrors();
      fetchCounters();
    }, 3000); // odświeżanie co 3 sekundy
    return () => clearInterval(intervalId);
  }, [config, selectedTimeRange, machineId]);

  const fetchPartErrors = async (partId) => {
    setPartLoading(true);
    setPartError(null);
    const dateFrom = getDateFrom();
    try {
      const res = await fetch(
        `${API_BASE}/api/get_error_for_parts?part_id=${partId}&date_from=${encodeURIComponent(
          dateFrom
        )}`
      );
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

  if (!machineId) return null;
  if (loading) return <p>Ładowanie konfiguracji maszyny...</p>;
  if (error) return <p style={{ color: "red" }}>{String(error)}</p>;

  if (selectedPart) {
    return (
      <div style={{ padding: "20px" }}>
        <button
          onClick={() => setSelectedPart(null)}
          style={{ marginBottom: "10px" }}
        >
          ← Powrót
        </button>
        <h2>
          Błędy dla części {selectedPart.name} w zakresie{" "}
          {timeOptions.find((o) => o.value === selectedTimeRange)?.label}
        </h2>

        {partLoading && <p>Ładowanie...</p>}
        {partError && <p style={{ color: "red" }}>{String(partError)}</p>}

        {!partLoading && !partError && partErrors.length === 0 && <p>Brak błędów</p>}

        {!partLoading && !partError && partErrors.length > 0 && (
          <table
            border="1"
            cellPadding="5"
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead>
              <tr>
                <th>ID błędu</th>
                <th>Kod błędu</th>
                <th>Opis</th>
                <th>Wystąpienie</th>
              </tr>
            </thead>
            <tbody>
              {partErrors.map((e) => (
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
    <div>
      <div style={{ marginBottom: 10 }}>
        <label>Wybierz zakres czasu: </label>
        <select
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value)}
        >
          {timeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div
        className="machine-config-board"
        style={{ position: "relative", width: "100%", height: "500px" }}
      >
        {config.map((item) => {
          const errs = errorsMap[item.id] || [];
          const errsText = errs.length > 0 ? errs.join(", ") : "";
          const counterData = countersMap[item.id];

          return (
            <button
              key={item.id}
              className="machine-button"
              title={item.name}
              style={{
                position: "absolute",
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                fontSize: "12px",
                lineHeight: "1.2",
                whiteSpace: "normal",
                padding: "4px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "60px",
              }}
              onClick={() => {
                setSelectedPart(item);
                fetchPartErrors(item.id);
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {/* Status */}
                {counterData && (
                  <div
                    style={{
                      color: counterData.is_empty ? "red" : "green",
                      fontSize: "16px",
                      textAlign: "center",
                    }}
                  >
                    {counterData.is_empty ? "BRAK" : "OK"}
                  </div>
                )}

                {/* Licznik tylko jeśli > 0, pod statusem */}
                {counterData && counterData.counter > 0 && (
                  <div style={{ color: "blue", fontWeight: "bold", marginTop: "2px" }}>
                    {counterData.counter}
                  </div>
                )}

                {/* Nazwa części */}
                {counterData && (
                  <div
                    style={{
                      fontSize: "10px",
                      marginTop: "2px",
                      textAlign: "center",
                    }}
                  >
                    {counterData.name}
                  </div>
                )}

                {/* Błędy */}
                {errsText && (
                  <div
                    style={{
                      color: "red",
                      fontSize: "8px",
                      marginTop: "2px",
                      maxWidth: "80px",
                      textAlign: "center",
                      wordBreak: "break-word",
                    }}
                  >
                    {errsText}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MachineConfig;
