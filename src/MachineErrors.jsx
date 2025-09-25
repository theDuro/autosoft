import React, { useEffect, useState } from "react";
import "./MachineErrors.css";

const API_BASE =
  "https://autosoftv2-h4eeh8emg3dzceds.germanywestcentral-01.azurewebsites.net/";

const MachineConfig = ({ machineId }) => {
  const [config, setConfig] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!machineId) return;

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/get_machine_parts_by_machine_id/${machineId}`)
      .then((res) =>
        res.ok
          ? res.json()
          : Promise.reject("Błąd pobierania konfiguracji maszyny")
      )
      .then((data) => setConfig(Array.isArray(data) ? data : []))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [machineId]);

  if (!machineId) return null;
  if (loading) return <p>Ładowanie konfiguracji maszyny...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="machine-config-board">
      {config.map((item) => (
        <button
          key={item.id}
          className="machine-button"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
          }}
          title={item.name}
        >
          {item.name}
        </button>
      ))}
    </div>
  );
};

export default MachineConfig;
