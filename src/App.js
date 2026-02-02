import React from "react";
import MachineErrors from "./MachineErrors"; // lub ./MachineConfig
import TopActions from "./TopActions";

function App() {
  return (
    <div>
      <h1>Podgląd maszyny nr 1</h1>
      <MachineErrors machineId={1} />
    </div>
  );
}

export default App;