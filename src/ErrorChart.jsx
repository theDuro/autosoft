import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const hostname = window.location.hostname;
const protocol = window.location.protocol;
const API_BASE = `${protocol}//${hostname}:5000`;

const timeRangeOptions = [
  { label: "1 godzina", value: "1h", hours: 1 },
  { label: "2 godziny", value: "2h", hours: 2 },
  { label: "3 godziny", value: "3h", hours: 3 },
  { label: "1 dzień", value: "1d", hours: 24 },
  { label: "2 dni", value: "2d", hours: 48 },
  { label: "1 tydzień", value: "1w", hours: 168 },
  { label: "2 tygodnie", value: "2w", hours: 336 },
  { label: "1 miesiąc", value: "1m", hours: 720 },
  { label: "2 miesiące", value: "2m", hours: 1440 },
];

const ErrorChart = ({ machineId }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("1h");
  const [parts, setParts] = useState([]);

  // Pobierz listę części
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
    const hours = option ? option.hours : 1;
    const from = new Date(now.getTime() - hours * 60 * 60 * 1000);
    return from.toISOString();
  };

  // Funkcja pobierająca błędy dla wszystkich części
  const fetchErrorsForAllParts = async () => {
    if (!parts.length) return;
    
    setLoading(true);
    const dateFrom = getDateFrom();
    
    try {
      const results = await Promise.all(
        parts.map(async (part) => {
          try {
            const url = `${API_BASE}/api/get_error_for_parts?part_id=${part.id}&date_from=${encodeURIComponent(dateFrom)}`;
            const res = await fetch(url);
            if (!res.ok) {
              console.warn(`Failed to fetch errors for part ${part.id}`);
              return { partId: part.id, partName: part.name, errorCount: 0 };
            }
            const data = await res.json();
            const errorCount = Array.isArray(data) ? data.length : 0;
            return {
              partId: part.id,
              partName: part.name,
              errorCount: errorCount
            };
          } catch (err) {
            console.error(`Error fetching for part ${part.id}:`, err);
            return { partId: part.id, partName: part.name, errorCount: 0 };
          }
        })
      );

      // Sortowanie po partId od 1 do 42
      const sortedResults = results.sort((a, b) => a.partId - b.partId);
      setChartData(sortedResults);
    } catch (err) {
      console.error("Error fetching chart data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Pobierz dane przy montowaniu i przy zmianie zakresu czasu
  useEffect(() => {
    if (parts.length > 0) {
      fetchErrorsForAllParts();
    }
  }, [parts, selectedTimeRange]);

  // Odświeżanie co 10 minut
  useEffect(() => {
    if (parts.length === 0) return;

    const interval = setInterval(() => {
      fetchErrorsForAllParts();
    }, 10 * 60 * 1000); // 10 minut

    return () => clearInterval(interval);
  }, [parts, selectedTimeRange]);

  const totalErrors = chartData.reduce((sum, item) => sum + item.errorCount, 0);
  const maxErrorPart = chartData.length > 0 
    ? chartData.reduce((max, item) => item.errorCount > max.errorCount ? item : max, chartData[0])
    : null;

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
      {/* Nagłówek i kontrolki - kompaktowy */}
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
        <h2 style={{ color: "#ff8c00", margin: 0, fontSize: "20px" }}>Wykres błędów</h2>

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

        {/* Podsumowanie - inline - tylko jeśli są błędy */}
        {!loading && totalErrors > 0 && (
          <div style={{ 
            display: "flex",
            gap: "20px",
            fontSize: "14px"
          }}>
            <div>
              <strong>Suma:</strong>{" "}
              <span style={{ color: "#ff8c00", fontWeight: "bold" }}>
                {totalErrors}
              </span>
            </div>
            {maxErrorPart && maxErrorPart.errorCount > 0 && (
              <div>
                <strong>Max:</strong>{" "}
                <span style={{ color: "#e63946", fontWeight: "bold" }}>
                  {maxErrorPart.partName} ({maxErrorPart.errorCount})
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p>Ładowanie danych wykresu...</p>
        </div>
      )}

      {/* Wykres - maksymalna przestrzeń */}
      {!loading && chartData.length > 0 && (
        <div style={{ 
          flex: 1,
          padding: "10px",
          overflowX: "auto", 
          overflowY: "hidden",
        }}>
          <div style={{ 
            minWidth: "3000px", 
            height: "100%",
            backgroundColor: "#1a1a1a",
            borderRadius: "8px",
            padding: "15px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis 
                  dataKey="partName" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  stroke="#fff"
                  style={{ fontSize: "11px" }}
                  interval={0}
                />
                <YAxis 
                  stroke="#fff"
                  style={{ fontSize: "11px" }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#1a1a1a", 
                    border: "1px solid #ff8c00",
                    borderRadius: "4px",
                    color: "#fff"
                  }}
                  labelStyle={{ color: "#ff8c00", fontWeight: "bold" }}
                />
                <Bar 
                  dataKey="errorCount" 
                  fill="#ff8c00" 
                  name="Liczba błędów"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Informacja o braku danych */}
      {!loading && chartData.length === 0 && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "#aaa" }}>Brak danych do wyświetlenia</p>
        </div>
      )}

      {/* Stopka - minimalna */}
      <div style={{ 
        padding: "8px 20px",
        backgroundColor: "#1a1a1a",
        fontSize: "11px",
        color: "#aaa",
        textAlign: "center",
        flexShrink: 0
      }}>
        💡 Przesuń wykres • Odświeżanie co 10 min
      </div>
    </div>
  );
};

export default ErrorChart;