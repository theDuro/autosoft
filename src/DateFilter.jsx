const DateFilter = ({ dateFrom, dateTo, setDateFrom, setDateTo }) => (
  <div style={{ marginBottom: "10px", display: "flex", gap: "15px", alignItems: "center" }}>
    <label>
      Od:
      <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} max={dateTo || ""} />
    </label>
    <label>
      Do:
      <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} min={dateFrom || ""} />
    </label>
    <button onClick={() => { setDateFrom(""); setDateTo(""); }} title="Wyczyść daty">✖️</button>
  </div>
);

export default DateFilter;