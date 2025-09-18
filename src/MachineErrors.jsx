import React, { useEffect, useState } from "react";
import DateFilter from "./DateFilter"; // zakładam, że masz ten komponent
import "./MachineErrors.css";

const API_BASE = "https://autosoftv2-h4eeh8emg3dzceds.germanywestcentral-01.azurewebsites.net/";

const MachineErrors = ({ machineId }) => {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!machineId) return;

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/get_errors_by_machine_id/${machineId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject("Błąd pobierania błędów")))
      .then(setErrors)
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [machineId]);

  if (!machineId) return null;
  if (loading) return <p>Ładowanie błędów...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  // filtr błędów wg lokalnych dat
  const filteredErrors = errors.filter((e) => {
    const errorDate = new Date(e.created_at);
    if (dateFrom && errorDate < new Date(dateFrom)) return false;
    if (dateTo && errorDate > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  return (
    <div className="machine-errors">
      <h3>Błędy maszyny</h3>

      <DateFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        setDateFrom={setDateFrom}
        setDateTo={setDateTo}
      />

      {filteredErrors.length === 0 ? (
        <p>Brak błędów w wybranym zakresie dat.</p>
      ) : (
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
            {filteredErrors.map((e) => (
              <tr key={e.id}>
                <td>{e.id}</td>
                <td>{e.error_code}</td>
                <td>{e.description}</td>
                <td>{new Date(e.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MachineErrors;