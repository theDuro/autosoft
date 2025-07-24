const MachineTable = ({ data }) => (
  <div className="table-wrapper" style={{ maxHeight: "400px", overflowY: "auto" }}>
    <table className="data-table">
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Cycle</th>
          <th>Error</th>
          <th>Running</th>
          <th>Machine ID</th>
          <th>tag1</th>
          <th>tag2</th>
          <th>tag3</th>
          <th>tag4</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => (
          <tr key={idx}>
            <td>{item.timestamp}</td>
            <td>{item.cycle_completed ? "Tak" : "Nie"}</td>
            <td>{item.has_error ? "Tak" : "Nie"}</td>
            <td>{item.is_running ? "Tak" : "Nie"}</td>
            <td>{item.machine_id}</td>
            <td>{item.tag1}</td>
            <td>{item.tag2}</td>
            <td>{item.tag3}</td>
            <td>{item.tag4}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default MachineTable;