import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const ErrorChart = ({ apiBase, parts, timeOptions }) => {
  const [timeRange, setTimeRange] = useState("1h");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  const getDateFrom = () => {
    const now = new Date();
    const from = new Date(now);
    switch (timeRange) {
      case "1m": from.setMinutes(now.getMinutes() - 1); break;
      case "10m": from.setMinutes(now.getMinutes() - 10); break;
      case "1h": from.setHours(now.getHours() - 1); break;
      case "2h": from.setHours(now.getHours() - 2); break;
      case "3h": from.setHours(now.getHours() - 3); break;
      case "1d": from.setDate(now.getDate() - 1); break;
      default: from.setHours(now.getHours() - 1);
    }
    return from.toISOString();
  };

  const fetchData = async () => {
    if (!parts || parts.length === 0) return;
    setLoading(true);
    const dateFrom = getDateFrom();

    try {
      const entries = await Promise.all(
        parts.map(async (part) => {
          const res = await fetch(
            `${apiBase}/api/get_error_str?part_id=${encodeURIComponent(part.id)}&date_from=${encodeURIComponent(dateFrom)}`
          );

          if (!res.ok) return { partName: part.name, errors: 0 };
          const data = await res.json();
          return { partName: part.name, errors: Array.isArray(data) ? data.length : 0 };
        })
      );

      // Sortowanie po numerze w nazwie
      const sortedEntries = entries.sort((a, b) => {
        const numA = parseInt(a.partName.replace(/\D/g, ""), 10) || 0;
        const numB = parseInt(b.partName.replace(/\D/g, ""), 10) || 0;
        return numA - numB;
      });

      setChartData(sortedEntries);
    } catch (err) {
      console.error(err);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [parts, timeRange]);

  // --- dynamiczna szerokość wykresu zależna od liczby słupków ---
  const chartWidth = Math.max(chartData.length * 40, 800); // 40px na słupek, min 800px

  return (
    <div style={{ width: "100%", overflowX: "auto", padding: "10px" }}>
      {/* Kontrolki czasu */}
      <div style={{ marginBottom: 10 }}>
        <label>Zakres czasu: </label>
        <select value={timeRange} onChange={e => setTimeRange(e.target.value)}>
          {timeOptions?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          )) || (
            <>
              <option value="1m">1 minuta</option>
              <option value="10m">10 minut</option>
              <option value="1h">1 godzina</option>
              <option value="2h">2 godziny</option>
              <option value="3h">3 godziny</option>
              <option value="1d">1 dzień</option>
            </>
          )}
        </select>
      </div>

      {/* Wykres */}
      {loading ? (
        <p>Ładowanie danych...</p>
      ) : (
        <div style={{ width: chartWidth, height: 420 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={30}>
              <XAxis dataKey="partName" interval={0} angle={-35} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="errors" fill="#ff4d4d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ErrorChart;
