import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./MachinesList.css";

const API_BASE = "https://autosoftv2-h4eeh8emg3dzceds.germanywestcentral-01.azurewebsites.net";

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
  const [showChart, setShowChart] = useState(false);

  // Daty do filtrowania
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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
    setShowChart(false);
    setLoadingMachineData(true);
    setMachineDataError(null);
    setDateFrom("");
    setDateTo("");

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
    setShowChart(false);
    setLoadingMachineData(true);
    setMachineDataError(null);
    setDateFrom("");
    setDateTo("");

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
    setShowChart(false);
    setDateFrom("");
    setDateTo("");
  };

  const handleLogoutClick = () => {
    localStorage.removeItem("token");
    if (onLogout) onLogout();
    window.location.reload();
  };

  const handleShowChartClick = () => setShowChart(true);
  const handleHideChartClick = () => setShowChart(false);

  // Filtrujemy dane wg zakresu dat
  const filteredData = machineData.filter((item) => {
    const itemDate = new Date(item.timestamp);
    if (dateFrom && itemDate < new Date(dateFrom)) return false;
    if (dateTo && itemDate > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  return (
    <div className="container">
      <button onClick={handleLogoutClick} className="logout-btn">
        Wyloguj
      </button>

      {loading && <p>Ładowanie danych...</p>}
      {error && <p style={{ color: "red" }}>Błąd: {error}</p>}

      {!loading && !error && (selectedMachineId || showAllData) && (
        <div>
          <button onClick={handleBackClick} className="back-btn">
            ← Wstecz
          </button>
          <h2>{showAllData ? "Wszystkie dane maszyn" : `Dane maszyny: ${selectedMachineName}`}</h2>
          <p>Łączna liczba rekordów: {filteredData.length}</p>

          {/* Kalendarzyki do wyboru dat */}
          <div
            style={{ marginBottom: "10px", display: "flex", gap: "15px", alignItems: "center" }}
          >
            <label>
              Od:{" "}
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo || ""}
              />
            </label>
            <label>
              Do:{" "}
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || ""}
              />
            </label>
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              style={{ marginLeft: "10px" }}
              title="Wyczyść daty"
            >
              ✖️
            </button>
          </div>

          {loadingMachineData ? (
            <p>Ładowanie danych...</p>
          ) : machineDataError ? (
            <p style={{ color: "red" }}>Błąd: {machineDataError}</p>
          ) : filteredData.length === 0 ? (
            <p>Brak danych w wybranym zakresie dat</p>
          ) : (
            <>
              {!showChart ? (
                <>
                  {/* Dwa nowe przyciski nad tabelą */}
                  <div
                    style={{
                      marginBottom: "10px",
                      display: "flex",
                      gap: "15px",
                      alignItems: "center",
                    }}
                  >
                    <button
                      onClick={() =>
                        alert(`Zatrzymaj maszynę: ${selectedMachineName || "Wszystkie"}`)
                      }
                      className="action-btn"
                    >
                      Zatrzymaj maszynę
                    </button>
                    <button
                      onClick={() =>
                        alert(`Bezpieczeństwo: ${selectedMachineName || "Wszystkie"}`)
                      }
                      className="action-btn"
                    >
                      Bezpieczeństwo
                    </button>
                  </div>

                  <button onClick={handleShowChartClick} className="chart-btn">
                    📊 Pokaż jako wykres
                  </button>
                  <div
                    className="table-wrapper"
                    style={{ maxHeight: "400px", overflowY: "auto" }}
                  >
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
                        {filteredData.map((item, idx) => (
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
                </>
              ) : (
                <>
                  <div className="chart-wrapper" style={{ width: "100%", height: 400 }}>
                    <ResponsiveContainer>
                      <BarChart data={filteredData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(tick) => tick.slice(11, 19)}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="tag1" fill="#8884d8" name="Tag1" />
                        <Bar dataKey="tag2" fill="#82ca9d" name="Tag2" />
                        <Bar dataKey="tag3" fill="#ffc658" name="Tag3" />
                        <Bar dataKey="tag4" fill="#ff7300" name="Tag4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <button onClick={handleHideChartClick} className="chart-btn">
                    ← Powrót do tabeli
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

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

