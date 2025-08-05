import React, { useEffect, useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import axios from "axios";

const API_BASE = "https://autosoftv2-h4eeh8emg3dzceds.germanywestcentral-01.azurewebsites.net";

const DEFAULT_TAG_LABELS = {
  tag1: "tag1",
  tag2: "tag2",
  tag3: "tag3",
  tag4: "tag4"
};

const downsampleData = (data, maxPoints = 200) => {
  if (!data || data.length <= maxPoints) return data;
  const factor = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % factor === 0);
};

const MachineChart = ({ data, machineId }) => {
  const [tagLabels, setTagLabels] = useState(DEFAULT_TAG_LABELS);

  useEffect(() => {
    if (!machineId) return;

    axios
      .get(`${API_BASE}/api/get_conf_by_machine_id/${machineId}`)
      .then((response) => {
        const tags = response.data?.tags || {};
        setTagLabels({ ...DEFAULT_TAG_LABELS, ...tags });
      })
      .catch((err) => {
        console.error("Błąd podczas pobierania etykiet:", err);
      });
  }, [machineId]);

  const sampledData = useMemo(() => downsampleData(data, 200), [data]);

  const timestamps = sampledData.map((d) => d.timestamp.slice(11, 19));
  const tag1 = sampledData.map((d) => d.tag1);
  const tag2 = sampledData.map((d) => d.tag2);
  const tag3 = sampledData.map((d) => d.tag3);
  const tag4 = sampledData.map((d) => d.tag4);

  const options = {
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: [
        tagLabels.tag1,
        tagLabels.tag2,
        tagLabels.tag3,
        tagLabels.tag4
      ],
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: timestamps,
      axisLabel: {
        interval: Math.ceil(timestamps.length / 10),
      },
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: tagLabels.tag1,
        type: "bar",
        data: tag1,
      },
      {
        name: tagLabels.tag2,
        type: "bar",
        data: tag2,
      },
      {
        name: tagLabels.tag3,
        type: "bar",
        data: tag3,
      },
      {
        name: tagLabels.tag4,
        type: "bar",
        data: tag4,
      },
    ],
  };

  return (
    <div style={{ width: "100%", height: "400px" }}>
      <ReactECharts option={options} style={{ height: "100%" }} />
    </div>
  );
};

export default MachineChart;
