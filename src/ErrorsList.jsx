import React, { useEffect, useState } from "react";

const hostname = window.location.hostname;
const protocol = window.location.protocol;
const API_BASE = `${protocol}//${hostname}:5000`;

const timeRangeOptions = [
  { label: "10 minut", value: "10m", minutes: 10 },
  { label: "1 godzina", value: "1h", minutes: 60 },
  { label: "2 godziny", value: "2h", minutes: 120 },
  { label: "3 godziny", value: "3h", minutes: 180 },
  { label: "1 dzień", value: "1d", minutes: 1440 },
  { label: "1 tydzień", value: "1w", minutes: 10080 },
];

const ErrorsList = ({ machineId }) => {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("1h");
  const [parts, setParts] = useState([]);

  // Pobierz listę części dla mapowania ID -> nazwa
  useEffect(() => {
    if (!machineId) return;
    fetch(`${API_BASE}/api/get_machine_parts_by_machine_id/${machineId}`)
      .then(r => r.json())
      .then(d => setParts(Array.isArray(d) ? d : []))
      .catch(e => console.error(e));
  }, [machineId]);

  // Funkcja do obliczania daty początkowej
  const getDateFrom = () => {
    const now = new Date();
    const option = timeRangeOptions.find(o => o.value === selectedTimeRange);
    const minutes = option ? option.minutes : 60;
    const from = new Date(now.getTime() - minutes * 60 * 1000);
    return from.toISOString();
  };

  // Funkcja pobierająca wszystkie błędy
  const fetchAllErrors = async () => {
    if (!parts.length) return;
    
    setLoading(true);
    const dateFrom = getDateFrom();
    
    try {
      const allErrors = [];
      
      // Pobierz błędy dla każdej części
      await Promise.all(
        parts.map(async (part) => {
          try {
            const url = `${API_BASE}/api/get_error_for_parts?part_id=${part.id}&date_from=${encodeURIComponent(dateFrom)}`;
            const res = await fetch(url);
            if (!res.ok) {
              console.warn(`Failed to fetch errors for part ${part.id}`);
              return;
            }
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              // Dodaj nazwę części do każdego błędu
              data.forEach(error => {
                allErrors.push({
                  ...error,
                  partName: part.name,
                  partId: part.id
                });
              });
            }
          } catch (err) {
            console.error(`Error fetching for part ${part.id}:`, err);
          }
        })
      );

      // Sortuj po dacie od najnowszych
      allErrors.sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));
      setErrors(allErrors);
    } catch (err) {
      console.error("Error fetching errors list:", err);
    } finally {
      setLoading(false);
    }
  };

  // Pobierz dane przy montowaniu i przy zmianie zakresu czasu
  useEffect(() => {
    if (parts.length > 0) {
      fetchAllErrors();
    }
  }, [parts, selectedTimeRange]);

  // Odświeżanie co 10 minut
  useEffect(() => {
    if (parts.length === 0) return;

    const interval = setInterval(() => {
      fetchAllErrors();
    }, 10 * 60 * 1000); // 10 minut

    return () => clearInterval(interval);
  }, [parts, selectedTimeRange]);

  return (
    <div style={{ 
      width: "100vw",
      height: "100vh",
      backgroundColor: "#2c2c2c", 
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      padding: 0,
      margin: 0,
      overflow: "hidden"
    }}>
      {/* Nagłówek i kontrolki */}
      <div style={{ 
        padding: "15px 20px",
        backgroundColor: "#1a1a1a",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <h2 style={{ color: "#ff8c00", margin: 0, fontSize: "20px" }}>Lista wszystkich błędów</h2>

        {/* Wybór zakresu czasu */}
        <div>
          <label style={{ marginRight: "10px", fontWeight: "bold", fontSize: "14px" }}>
            Zakres:
          </label>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "#ff8c00",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            {timeRangeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Licznik błędów */}
        {!loading && (
          <div style={{ fontSize: "14px" }}>
            <strong>Znaleziono:</strong>{" "}
            <span style={{ color: "#ff8c00", fontWeight: "bold", fontSize: "16px" }}>
              {errors.length}
            </span>{" "}
            błędów
          </div>
        )}
      </div>

      {loading && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p>Ładowanie błędów...</p>
        </div>
      )}

      {/* Tabela błędów - przewijana */}
      {!loading && errors.length > 0 && (
        <div style={{ 
          flex: 1,
          padding: "10px 20px",
          overflowY: "auto",
          overflowX: "hidden"
        }}>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse",
            backgroundColor: "#1a1a1a",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
          }}>
            <thead style={{ 
              position: "sticky", 
              top: 0, 
              backgroundColor: "#333",
              zIndex: 10
            }}>
              <tr>
                <th style={{ 
                  padding: "12px", 
                  textAlign: "left", 
                  borderBottom: "2px solid #ff8c00",
                  color: "#ff8c00",
                  fontWeight: "bold"
                }}>
                  Część
                </th>
                <th style={{ 
                  padding: "12px", 
                  textAlign: "left", 
                  borderBottom: "2px solid #ff8c00",
                  color: "#ff8c00",
                  fontWeight: "bold"
                }}>
                  Kod błędu
                </th>
                <th style={{ 
                  padding: "12px", 
                  textAlign: "left", 
                  borderBottom: "2px solid #ff8c00",
                  color: "#ff8c00",
                  fontWeight: "bold"
                }}>
                  Opis
                </th>
                <th style={{ 
                  padding: "12px", 
                  textAlign: "left", 
                  borderBottom: "2px solid #ff8c00",
                  color: "#ff8c00",
                  fontWeight: "bold"
                }}>
                  Data i godzina
                </th>
              </tr>
            </thead>
            <tbody>
              {errors.map((error, index) => (
                <tr 
                  key={`${error.id}-${index}`}
                  style={{ 
                    backgroundColor: index % 2 === 0 ? "#2c2c2c" : "#1a1a1a",
                    borderBottom: "1px solid #444"
                  }}
                >
                  <td style={{ 
                    padding: "10px 12px",
                    color: "#fff",
                    fontWeight: "bold"
                  }}>
                    {error.partName}
                  </td>
                  <td style={{ 
                    padding: "10px 12px",
                    color: "#e63946",
                    fontWeight: "bold"
                  }}>
                    {error.error_code}
                  </td>
                  <td style={{ 
                    padding: "10px 12px",
                    color: "#ccc"
                  }}>
                    {error.description}
                  </td>
                  <td style={{ 
                    padding: "10px 12px",
                    color: "#aaa",
                    fontSize: "13px"
                  }}>
                    {new Date(error.occurred_at).toLocaleString('pl-PL', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Brak błędów */}
      {!loading && errors.length === 0 && (
        <div style={{ 
          flex: 1, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          flexDirection: "column",
          gap: "10px"
        }}>
          <p style={{ color: "#2a9d8f", fontSize: "24px", fontWeight: "bold" }}>✓ Brak błędów</p>
          <p style={{ color: "#aaa" }}>Nie wykryto żadnych błędów w wybranym okresie</p>
        </div>
      )}

      {/* Stopka */}
      <div style={{ 
        padding: "8px 20px",
        backgroundColor: "#1a1a1a",
        fontSize: "11px",
        color: "#aaa",
        textAlign: "center",
        flexShrink: 0
      }}>
        🔄 Odświeżanie automatyczne co 10 minut • Sortowanie od najnowszych
      </div>
    </div>
  );
};

export default ErrorsList;