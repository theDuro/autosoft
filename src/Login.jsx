import React, { useState } from "react";
const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("https://autosoftv2-h4eeh8emg3dzceds.germanywestcentral-01.azurewebsites.net/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.access_token);
        onLogin();
      } else {
        setError(data.msg || "Błąd logowania");
      }
    } catch (err) {
      setError("Problem z serwerem");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Logowanie</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        type="text"
        placeholder="Login"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <br />
      <input
        type="password"
        placeholder="Hasło"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <button type="submit">Zaloguj</button>
    </form>
  );
};

export default Login;