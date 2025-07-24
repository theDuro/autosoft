import React, { useEffect, useState } from "react";
import MachineCard from "./MachineCard";
import MachineTable from "./MachineTable";
import MachineChart from "./MachineChart";
import DateFilter from "./DateFilter";
import TopActions from "./TopActions";
import "./MachinesList.css";

const API_BASE = "https://autosoftv2-h4eeh8emg3dzceds.germanywestcentral-01.azurewebsites.net/";

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

const MachinesList = ({ onLogout }) => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMachineId, setSelectedMachineId] = useState(null);
  const [selectedMachineName, setSelectedMachineName] = useState(null);
  const [machineData, setMachineData] = useState([]);
  const [loadingMachineData, setLoadingMachineData] = useState(false);
  const [machineDataError, setMachineDataError] = useState(null);
  const [showAllData, setShowAllData] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const token = localStorage.getItem("token");
  const decoded = token ? parseJwt(token) : null;
  const companyId = decoded?.sub?.company_id;

  useEffect(() => {
    if (!companyId) {
      setError("Nie można pobrać company_id z tokena.");
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/get_machines_by_company_id/${companyId}`)
      .then((res) => res.ok ? res.json() : Promise.reject("Błąd podczas pobierania maszyn"))
      .then(setMachines)
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [companyId]);

  const handleCardClick = (id) => {
    const machine = machines.find((m) => m.id === id);
    setSelectedMachineId(id);
    setSelectedMachineName(machine?.name || `Maszyna ${id}`);
    fetchMachineData(`/api/get_machine_data_by_id/${id}`);
  };

  const handleAllDataClick = () => {
    setSelectedMachineId(null);
    setSelectedMachineName(null);
    setShowAllData(true);
    fetchMachineData(`/api/get_machine_data_by_company_id/${companyId}`);
  };

  const fetchMachineData = (urlPath) => {
    setLoadingMachineData(true);
    setMachineDataError(null);
    setShowChart(false);
    setDateFrom("");
    setDateTo("");

    fetch(`${API_BASE}${urlPath}`)
      .then((res) => res.ok ? res.json() : Promise.reject("Błąd pobierania danych"))
      .then(setMachineData)
      .catch((err) => setMachineDataError(err))
      .finally(() => setLoadingMachineData(false));
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
    onLogout?.();
    window.location.reload();
  };

  const filteredData = machineData.filter((item) => {
    const itemDate = new Date(item.timestamp);
    if (dateFrom && itemDate < new Date(dateFrom)) return false;
    if (dateTo && itemDate > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  return (
    <div className="container">
      <button onClick={handleLogoutClick} className="logout-btn">Wyloguj</button>

      {loading && <p>Ładowanie danych...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (selectedMachineId || showAllData) && (
        <>
          <button onClick={handleBackClick} className="back-btn">← Wstecz</button>
          <h2>{showAllData ? "Wszystkie dane maszyn" : `Dane maszyny: ${selectedMachineName}`}</h2>
          <p>Łączna liczba rekordów: {filteredData.length}</p>

          <DateFilter {...{ dateFrom, dateTo, setDateFrom, setDateTo }} />

          {loadingMachineData ? (
            <p>Ładowanie danych maszyny...</p>
          ) : machineDataError ? (
            <p style={{ color: "red" }}>{machineDataError}</p>
          ) : filteredData.length === 0 ? (
            <p>Brak danych w wybranym zakresie</p>
          ) : !showChart ? (
            <>
              <TopActions
                machineName={selectedMachineName}
                onStop={() => alert(`Zatrzymaj maszynę: ${selectedMachineName || "Wszystkie"}`)}
                onSecure={() => alert(`Bezpieczeństwo: ${selectedMachineName || "Wszystkie"}`)}
                onShowChart={() => setShowChart(true)}
              />
              <MachineTable data={filteredData} />
            </>
          ) : (
            <>
              <MachineChart data={filteredData} />
              <button onClick={() => setShowChart(false)} className="chart-btn">← Powrót do tabeli</button>
            </>
          )}
        </>
      )}

      {!loading && !error && !selectedMachineId && !showAllData && (
        <div className="card-grid">
          {machines.map((machine) => (
            <MachineCard key={machine.id} machine={machine} onClick={handleCardClick} />
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