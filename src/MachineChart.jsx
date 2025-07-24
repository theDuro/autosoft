import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer
} from "recharts";

const MachineChart = ({ data }) => (
  <div className="chart-wrapper" style={{ width: "100%", height: 400 }}>
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" tickFormatter={(tick) => tick.slice(11, 19)} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="tag1" fill="#8884d8" />
        <Bar dataKey="tag2" fill="#82ca9d" />
        <Bar dataKey="tag3" fill="#ffc658" />
        <Bar dataKey="tag4" fill="#ff7300" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default MachineChart;