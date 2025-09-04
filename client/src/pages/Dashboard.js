import { useState } from "react";
import { useSession, fetchWithAuth } from "../services/authService";

function Dashboard() {
  const [protectedData, setProtectedData] = useState(null);
  const [error, setError] = useState(null);
  const timeLeft = useSession(); // countdown in seconds

  const getProtectedData = async () => { try { const res = await fetchWithAuth("http://localhost:4000/api/protected"); 
    if (!res.ok) throw new Error("Failed to fetch protected data"); 
    const data = await res.json(); setProtectedData(data); setError(null); }
   catch (err) { console.error(err); setError(err.message); } 
  };

  return (
    <div>
      <h1>Dashboard</h1>

      {timeLeft !== null && (
        <p style={{ color: "red" }}>
          Session expires in: {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
        </p>
      )}

      <button onClick={getProtectedData}>Fetch Protected Data</button>

      {protectedData && (
        <div style={{ marginTop: "20px", color: "green" }}>
          <pre>{JSON.stringify(protectedData, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div style={{ marginTop: "20px", color: "red" }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}


export default Dashboard;
