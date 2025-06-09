import logo from './logo.svg';
import './App.css';
import MachinesList from "./MachinesList"; 

function App() {
  return (
    <div>
      <h1>Lista maszyn</h1>
      <MachinesList /> {/* 👈 tutaj komponent jest użyty */}
    </div>
  );
}

export default App;
