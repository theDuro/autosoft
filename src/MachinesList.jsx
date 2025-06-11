import React, { useEffect, useState } from "react";

// 🔍 Funkcja dekodująca JWT (base64 → JSON)
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
}

const MachinesList = ({ onLogout }) => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔐 Pobierz company_id z JWT
  const token = localStorage.getItem("token");
  const decoded = token ? parseJwt(token) : null;
  const companyId = decoded?.sub?.company_id;

  const [selectedMachineId, setSelectedMachineId] = useState(null);
  const [machineData, setMachineData] = useState([]);
  const [loadingMachineData, setLoadingMachineData] = useState(false);
  const [machineDataError, setMachineDataError] = useState(null);

  const [showAllData, setShowAllData] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setError("Nie można pobrać company_id z tokena.");
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`http://127.0.0.1:5000/api/get_machines_by_company_id/${companyId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Błąd podczas pobierania danych maszyn");
        return res.json();
      })
      .then((data) => {
        setMachines(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [companyId]);

  const handleCardClick = (id) => {
    setSelectedMachineId(id);
    setShowAllData(false);
    setLoadingMachineData(true);
    setMachineDataError(null);

    fetch(`http://127.0.0.1:5000/api/get_machine_data_by_id/${id}`)
      .then((res) => {
        if (!res.ok)
          throw new Error("Błąd podczas pobierania szczegółów maszyny");
        return res.json();
      })
      .then((data) => {
        setMachineData(data);
        setLoadingMachineData(false);
      })
      .catch((err) => {
        console.error(err);
        setMachineData([]);
        setMachineDataError(err.message);
        setLoadingMachineData(false);
      });
  };

  const handleAllDataClick = () => {
    setSelectedMachineId(null);
    setShowAllData(true);
    setLoadingMachineData(true);
    setMachineDataError(null);

    fetch("http://127.0.0.1:5000/api/get_all_machine_data")
      .then((res) => {
        if (!res.ok)
          throw new Error("Błąd podczas pobierania wszystkich danych maszyn");
        return res.json();
      })
      .then((data) => {
        setMachineData(data);
        setLoadingMachineData(false);
      })
      .catch((err) => {
        console.error(err);
        setMachineData([]);
        setMachineDataError(err.message);
        setLoadingMachineData(false);
      });
  };

  const handleBackClick = () => {
    setSelectedMachineId(null);
    setShowAllData(false);
    setMachineData([]);
    setMachineDataError(null);
  };

  const handleLogoutClick = () => {
    localStorage.removeItem("token");
    if (onLogout) onLogout();
    window.location.reload();
  };

  // **Przycisk Wyloguj renderujemy zawsze**
  // Jeśli trwa ładowanie i jest błąd company_id, pokazujemy błąd, ale nie blokujemy renderu przycisku

  return (
    <div style={{ padding: 20 }}>
      <button
        onClick={handleLogoutClick}
        style={{
          marginBottom: 20,
          padding: "8px 16px",
          cursor: "pointer",
          backgroundColor: "#f44336",
          color: "white",
          border: "none",
          borderRadius: 4,
          fontWeight: "bold",
        }}
      >
        Wyloguj
      </button>

      {loading && <p>Ładowanie danych...</p>}

      {error && <p style={{ color: "red" }}>Błąd: {error}</p>}

      {!loading && !error && (selectedMachineId || showAllData) && (
        <div>
          <button onClick={handleBackClick} style={{ marginBottom: 20 }}>
            ← Wstecz
          </button>
          <h2>
            {showAllData
              ? "Wszystkie dane maszyn"
              : `Dane maszyny ID: ${selectedMachineId}`}
          </h2>
          {loadingMachineData ? (
            <p>Ładowanie danych...</p>
          ) : machineDataError ? (
            <p style={{ color: "red" }}>Błąd: {machineDataError}</p>
          ) : machineData.length === 0 ? (
            <p>Brak danych</p>
          ) : (
            <table
              border="1"
              cellPadding="8"
              style={{ borderCollapse: "collapse", width: "100%" }}
            >
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Cycle</th>
                  <th>Error</th>
                  <th>Running</th>
                  <th>Machine ID</th>
                  <th>tag1</th>
                  <th>tag2</th>
                  <th>tag3</th>
                  <th>tag4</th>
                </tr>
              </thead>
              <tbody>
                {machineData.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.timestamp}</td>
                    <td>{item.cycle_completed}</td>
                    <td>{item.has_error ? "Tak" : "Nie"}</td>
                    <td>{item.is_running ? "Tak" : "Nie"}</td>
                    <td>{item.machine_id}</td>
                    <td>{item.tag1}</td>
                    <td>{item.tag2}</td>
                    <td>{item.tag3}</td>
                    <td>{item.tag4}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!loading && !error && !selectedMachineId && !showAllData && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
          {machines.map((machine) => (
            <div
              key={machine.id}
              onClick={() => handleCardClick(machine.id)}
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: 20,
                width: 150,
                cursor: "pointer",
                boxShadow: "2px 2px 6px rgba(0,0,0,0.1)",
                backgroundColor: "#fff",
              }}
            >
              <h3>{machine.name}</h3>
            </div>
          ))}

          {/* Kafelek: wszystkie dane maszyn */}
          <div
            onClick={handleAllDataClick}
            style={{
              border: "2px solid #1890ff",
              borderRadius: 8,
              padding: 20,
              width: 150,
              cursor: "pointer",
              boxShadow: "2px 2px 6px rgba(24,144,255,0.3)",
              backgroundColor: "#e6f7ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              color: "#1890ff",
              textAlign: "center",
            }}
          >
            Wszystkie dane maszyn
          </div>
        </div>
      )}
    </div>
  );
};

export default MachinesList;