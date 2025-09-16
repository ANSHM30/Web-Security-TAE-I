import { useState } from "react";
import { useSession, fetchWithAuth } from "../services/authService";

function Dashboard() {
  const [protectedData, setProtectedData] = useState(null);
  const [error, setError] = useState(null);
  const timeLeft = useSession(); // countdown in seconds

  const getProtectedData = async () => {
    try {
      const res = await fetchWithAuth("http://localhost:4000/api/protected");
      if (!res.ok) throw new Error("Failed to fetch protected data");
      const data = await res.json();
      setProtectedData(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c1427] via-[#101a34] to-[#0c1427]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            {timeLeft !== null && (
              <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                Session expires in: {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
              </span>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={getProtectedData}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Fetch Protected Data
            </button>
          </div>

          {protectedData && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-700">Response</h2>
              <pre className="mt-2 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto">
                {JSON.stringify(protectedData, null, 2)}
              </pre>
            </div>
          )}

          {error && (
            <div className="mt-6 text-red-600">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
