import React, { useEffect, useState } from "react";
import "./MachineErrors.css";

const API_BASE =
  "https://autosoftv2-h4eeh8emg3dzceds.germanywestcentral-01.azurewebsites.net/";

const MachineConfig = ({ machineId }) => {
  const [config, setConfig] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [errorsMap, setErrorsMap] = useState({});
  const [selectedPart, setSelectedPart] = useState(null);
  const [partErrors, setPartErrors] = useState([]);
  const [partLoading, setPartLoading] = useState(false);
  const [partError, setPartError] = useState(null);

  // Pobierz konfigurację części
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

  // Pobierz błędy dla wszystkich części
  const fetchErrors = async () => {
    if (!config || config.length === 0) {
      setErrorsMap({});
      return;
    }

    const entries = await Promise.all(
      config.map(async (item) => {
        const url = `${API_BASE}/api/get_error_ids?part_id=${encodeURIComponent(
          item.id
        )}&date_from=${encodeURIComponent(date + "T00:00:00")}`;
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

  // Odświeżanie błędów co 10s
  useEffect(() => {
    if (!config || config.length === 0) return;
    fetchErrors();
    const intervalId = setInterval(fetchErrors, 3000);
    return () => clearInterval(intervalId);
  }, [config, date]);

  // Pobierz szczegóły błędów dla wybranej części
  const fetchPartErrors = async (partId) => {
    setPartLoading(true);
    setPartError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/get_error_for_parts?part_id=${partId}&date_from=${encodeURIComponent(
          date + "T00:00:00"
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

  // Widok szczegółów błędów
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
          Błędy dla części {selectedPart.name} od dnia {date}
        </h2>

        {partLoading && <p>Ładowanie...</p>}
        {partError && <p style={{ color: "red" }}>{String(partError)}</p>}

        {!partLoading && !partError && partErrors.length === 0 && (
          <p>Brak błędów</p>
        )}

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

  // Widok planszy z przyciskami
  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <label>Wybierz datę: </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div
        className="machine-config-board"
        style={{ position: "relative", width: "100%", height: "500px" }}
      >
        {config.map((item) => {
          const errs = errorsMap[item.id] || [];
          const errsText = errs.length > 0 ? errs.join(", ") : "Brak błędów";

          return (
            <button
              key={item.id}
              className="machine-button"
              //test 1.10
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
              }}
              onClick={() => {
                setSelectedPart(item);
                fetchPartErrors(item.id);
              }}
            >
              <div>{item.name}</div>
              <div
                style={{
                  color: errs.length ? "red" : "#999",
                  fontSize: "4px",
                  marginTop: "2px",
                }}
              >
                {errsText}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MachineConfig;
