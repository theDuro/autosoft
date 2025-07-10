import React, { useEffect, useState } from "react";
import "./MachinesList.css";
const API_BASE = "https://autosoftv2-h4eeh8emg3dzceds.germanywestcentral-01.azurewebsites.net";
// Funkcja dekodująca JWT
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

  const token = localStorage.getItem("token");
  const decoded = token ? parseJwt(token) : null;
  const companyId = decoded?.sub?.company_id;

  const [selectedMachineId, setSelectedMachineId] = useState(null);
  const [selectedMachineName, setSelectedMachineName] = useState(null);
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

    fetch(`${API_BASE}/api/get_machines_by_company_id/${companyId}`)
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
    const machine = machines.find((m) => m.id === id);
    setSelectedMachineId(id);
    setSelectedMachineName(machine?.name || `Maszyna ${id}`);
    setShowAllData(false);
    setLoadingMachineData(true);
    setMachineDataError(null);

    fetch(`${API_BASE}/api/get_machine_data_by_id/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Błąd podczas pobierania szczegółów maszyny");
        return res.json();
      })
      .then((data) => {
        setMachineData(data);
        setLoadingMachineData(false);
      })
      .catch((err) => {
        setMachineData([]);
        setMachineDataError(err.message);
        setLoadingMachineData(false);
      });
  };

  const handleAllDataClick = () => {
    setSelectedMachineId(null);
    setSelectedMachineName(null);
    setShowAllData(true);
    setLoadingMachineData(true);
    setMachineDataError(null);

    fetch(`${API_BASE}/api/get_machine_data_by_company_id/${companyId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Błąd podczas pobierania wszystkich danych maszyn");
        return res.json();
      })
      .then((data) => {
        setMachineData(data);
        setLoadingMachineData(false);
      })
      .catch((err) => {
        setMachineData([]);
        setMachineDataError(err.message);
        setLoadingMachineData(false);
      });
  };

  const handleBackClick = () => {
    setSelectedMachineId(null);
    setSelectedMachineName(null);
    setShowAllData(false);
    setMachineData([]);
    setMachineDataError(null);
  };

  const handleLogoutClick = () => {
    localStorage.removeItem("token");
    if (onLogout) onLogout();
    window.location.reload();
  };

  return (
    <div className="container">
      <button onClick={handleLogoutClick} className="logout-btn">Wyloguj</button>

      {loading && <p>Ładowanie danych...</p>}
      {error && <p style={{ color: "red" }}>Błąd: {error}</p>}

      {/* Widok danych */}
      {!loading && !error && (selectedMachineId || showAllData) && (
        <div>
          <button onClick={handleBackClick} className="back-btn">← Wstecz</button>
          <h2>
            {showAllData
              ? "Wszystkie dane maszyn"
              : `Dane maszyny: ${selectedMachineName}`}
          </h2>

          {loadingMachineData ? (
            <p>Ładowanie danych...</p>
          ) : machineDataError ? (
            <p style={{ color: "red" }}>Błąd: {machineDataError}</p>
          ) : machineData.length === 0 ? (
            <p>Brak danych</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
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
                  <p>Łączna liczba rekordów: {machineData.length}</p>
                  {machineData.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.timestamp}</td>
                      <td>{item.cycle_completed ? "Tak" : "Nie"}</td>
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
            </div>
          )}
        </div>
      )}

      {/* Widok listy maszyn */}
      {!loading && !error && !selectedMachineId && !showAllData && (
        <div className="card-grid">
          {machines.map((machine) => (
            <div
              key={machine.id}
              className="machine-card"
              onClick={() => handleCardClick(machine.id)}
            >
              <h3>{machine.name}</h3>
            </div>
          ))}

          <div className="machine-card all-data-card" onClick={handleAllDataClick}>
            Wszystkie dane maszyn
          </div>
        </div>
      )}
    </div>
  );
};

export default MachinesList;