const MachineCard = ({ machine, onClick }) => (
  <div className="machine-card" onClick={() => onClick(machine.id)}>
    <h3>{machine.name}</h3>
  </div>
);

export default MachineCard;