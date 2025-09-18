import React, { useEffect, useState } from "react";
import "./MachineErrors.css";

const API_BASE = "https://autosoftv2-h4eeh8emg3dzceds.germanywestcentral-01.azurewebsites.net/";

const MachineErrors = ({ machineId }) => {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!machineId) return;

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/get_errors_by_machine_id/${machineId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject("Błąd pobierania błędów")))
      .then((data) => setErrors(data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [machineId]);

  if (!machineId) return null; // jeśli brak ID, nic nie renderujemy
  if (loading) return <p>Ładowanie błędów...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (errors.length === 0) return <p>Brak błędów dla tej maszyny.</p>;

  return (
    <div className="machine-errors">
      <h3>Błędy maszyny</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Kod błędu</th>
            <th>Opis</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((e) => (
            <tr key={e.id}>
              <td>{e.id}</td>
              <td>{e.error_code}</td>
              <td>{e.description}</td>
              <td>{new Date(e.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MachineErrors;