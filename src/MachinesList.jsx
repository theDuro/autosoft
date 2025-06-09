import React, { useEffect, useState } from "react";

const MachinesList = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("grid");

  const [selectedMachineId, setSelectedMachineId] = useState(null);
  const [machineData, setMachineData] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/get_machines")
      .then((res) => {
        if (!res.ok) throw new Error("Błąd podczas pobierania danych");
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
  }, []);

  const handleCardClick = (id) => {
    setSelectedMachineId(id);
    fetch(`http://127.0.0.1:5000/api/get_machine_data_by_id/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Błąd podczas pobierania szczegółów maszyny");
        return res.json();
      })
      .then((data) => {
        setMachineData(data);
      })
      .catch((err) => {
        console.error(err);
        setMachineData([]);
      });
  };

  if (loading) return <p>Ładowanie danych...</p>;
  if (error) return <p>Błąd: {error}</p>;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setView("grid")}
          disabled={view === "grid"}
          style={{ marginRight: 10 }}
        >
          Widok kafelków
        </button>
        <button onClick={() => setView("list")} disabled={view === "list"}>
          Widok listy
        </button>
      </div>

      {view === "grid" && (
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
                backgroundColor: selectedMachineId === machine.id ? "#e6f7ff" : "#fff",
              }}
            >
              <h3>{machine.name}</h3>
              {/*
              <p>ID: {machine.id}</p>
              <p>Company ID: {machine.company_id}</p>
              */}
            </div>
          ))}
        </div>
      )}

      {view === "list" && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {machines.map((machine) => (
            <li
              key={machine.id}
              onClick={() => handleCardClick(machine.id)}
              style={{
                borderBottom: "1px solid #ccc",
                padding: "10px 0",
                cursor: "pointer",
                backgroundColor: selectedMachineId === machine.id ? "#e6f7ff" : "#fff",
              }}
            >
              <strong>{machine.name}</strong> (ID: {machine.id}) - Firma: {machine.company_id}
            </li>
          ))}
        </ul>
      )}

      {selectedMachineId && (
        <div style={{ marginTop: 30 }}>
          <h2>Dane maszyny ID: {selectedMachineId}</h2>
          {machineData.length === 0 ? (
            <p>Brak danych lub trwa ładowanie...</p>
          ) : (
            <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Cycle</th>
                  <th>Error</th>
                  <th>Running</th>
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
    </div>
  );
};

export default MachinesList;