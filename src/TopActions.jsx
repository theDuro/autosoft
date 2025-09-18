import React from "react";
import "./TopActions.css"; // << import stylu

// Dodajemy onShowErrors do destrukturyzacji props
const TopActions = ({ onStop, onSecure, onShowChart, onGoToConfig, onShowErrors }) => (
  <div className="top-actions">
    <button onClick={onStop} className="action-btn">Zatrzymaj maszynę</button>
    <button onClick={onSecure} className="action-btn">Bezpieczeństwo</button>
    <button onClick={onShowChart} className="chart-btn">📊 Pokaż jako wykres</button>
    <button onClick={onGoToConfig} className="action-btn orange">⚙️ Przejdź do konfiguracji</button>
    <button onClick={onShowErrors} className="action-btn green">❗ Pokaż błędy</button>
  </div>
);

export default TopActions;