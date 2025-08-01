import React from "react";

const TopActions = ({ onStop, onSecure, onShowChart, onGoToConfig }) => (
  <div style={{ marginBottom: "10px", display: "flex", gap: "15px", alignItems: "center" }}>
    <button onClick={onStop} className="action-btn">Zatrzymaj maszynę</button>
    <button onClick={onSecure} className="action-btn">Bezpieczeństwo</button>
    <button onClick={onShowChart} className="chart-btn">📊 Pokaż jako wykres</button>
    <button onClick={onGoToConfig} className="action-btn orange">⚙️ Przejdź do konfiguracji</button>
  </div>
);

export default TopActions;