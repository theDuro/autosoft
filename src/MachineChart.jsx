import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer
} from "recharts";
import axios from "axios"; // Użyj axios lub fetch

const DEFAULT_TAG_LABELS = {
  tag1: "tag1",
  tag2: "tag2",
  tag3: "tag3",
  tag4: "tag4"
};

const MachineChart = ({ data }) => {
  const [tagLabels, setTagLabels] = useState(DEFAULT_TAG_LABELS);

  useEffect(() => {
    axios.get("http://localhost:5000/api/get_conf_by_machine_id/1")
      .then((response) => {
        const tags = response.data?.tags || {};
        // Mieszamy domyślne z odpowiedzią
        const merged = { ...DEFAULT_TAG_LABELS, ...tags };
        setTagLabels(merged);
      })
      .catch((err) => {
        console.error("Błąd podczas pobierania etykiet:", err);
      });
  }, []);

  return (
    <div className="chart-wrapper" style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tickFormatter={(tick) => tick.slice(11, 19)} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="tag1" name={tagLabels.tag1} fill="#8884d8" />
          <Bar dataKey="tag2" name={tagLabels.tag2} fill="#82ca9d" />
          <Bar dataKey="tag3" name={tagLabels.tag3} fill="#ffc658" />
          <Bar dataKey="tag4" name={tagLabels.tag4} fill="#ff7300" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MachineChart;
