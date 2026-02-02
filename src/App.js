import React from "react";
import MachineErrors from "./MachineErrors"; // lub ./MachineConfig
import TopActions from "./TopActions";

function App() {
  return (
    <div>
      <MachineErrors machineId={1} />
    </div>
  );
}

export default App;