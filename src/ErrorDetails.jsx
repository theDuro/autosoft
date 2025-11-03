import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

const API_BASE =
  "http://192.168.1.149:5000";
const ErrorDetails = () => {
  const { partId } = useParams();
  const [searchParams] = useSearchParams();
  const date = searchParams.get("date");
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!partId || !date) return;
    setLoading(true);
    setError(null);

    fetch(
      `${API_BASE}/api/get_error_for_parts?part_id=${partId}&date_from=${encodeURIComponent(date + "T00:00:00")}`
    )
      .then((res) => {
        if (!res.ok) return res.text().then((t) => Promise.reject(new Error(`HTTP ${res.status}: ${t}`)));
        return res.json();
      })
      .then((data) => setErrors(data))
      .catch((err) => setError(err?.message ?? String(err)))
      .finally(() => setLoading(false));
  }, [partId, date]);

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: "10px" }}>
        ← Powrót
      </button>

      <h2>
        Błędy dla części {partId} z dnia {date}
      </h2>

      {loading && <p>Ładowanie...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
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
            {errors.map((e) => (
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
};

export default ErrorDetails;