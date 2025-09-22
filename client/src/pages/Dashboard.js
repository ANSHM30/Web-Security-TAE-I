import { useEffect, useState, useCallback, useRef } from "react";
import api from "../api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");
  const [logs, setLogs] = useState([]);
  const [refreshToken, setRefreshToken] = useState("");

  const globalInterval = useRef(null);

  // Fetch user data and refresh token
  const fetchUserData = useCallback(async () => {
    try {
      const res = await api.get("/auth/me", { withCredentials: true });
      setUserData(res.data);
      setLoading(false);

      // Set refresh token from backend response
      setRefreshToken(res.data.refreshToken || "");

      const backendExpires = new Date(res.data.session.expiresAt);
      const storedExpires = sessionStorage.getItem("expiresAt");
      const expiresAt = storedExpires ? new Date(storedExpires) : backendExpires;

      startGlobalCountdown(expiresAt);
    } catch (err) {
      setError("Failed to fetch user data. Please login again.");
      setLoading(false);
    }
  }, []);

  // Countdown for session expiration
  const startGlobalCountdown = (expiresAt) => {
    if (globalInterval.current) clearInterval(globalInterval.current);

    const updateCountdown = () => {
      const now = new Date();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeRemaining("Session expired");
        clearInterval(globalInterval.current);
        toast.error("⏳ Session expired. Please login again.");
        navigate("/login");
      } else {
        const totalSeconds = Math.floor(diff / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        setTimeRemaining(`${minutes}m ${seconds < 10 ? "0" : ""}${seconds}s`);

        if (totalSeconds === 5) {
          toast.error("⚠️ Session expiring in 5 seconds!");
        }
      }
    };

    updateCountdown();
    globalInterval.current = setInterval(updateCountdown, 1000);
  };

  // Fetch login logs
  const fetchLogs = async () => {
    try {
      const res = await api.get("/auth/logs", { withCredentials: true });
      setLogs(res.data.logs);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
      toast.success("Logged out");
      navigate("/login");
    } catch (err) {
      toast.error("Error logging out");
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Fetch logs after user data is loaded
  useEffect(() => {
    if (userData) fetchLogs();
  }, [userData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-xl font-semibold text-gray-700">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <p className="text-red-500 text-lg font-medium mb-4">{error}</p>
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Welcome, {userData.user.username}!</h1>

      {/* User Info */}
      <div className="bg-white shadow rounded-lg p-6 w-full max-w-4xl mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">👤</span> Your Info
        </h2>
        <div className="flex justify-between">
          <p><span className="font-medium">Username:</span> {userData.user.username}</p>
          <p><span className="font-medium">Email:</span> {userData.user.email}</p>
        </div>
      </div>

      {/* Session Info */}
      <div className="bg-white shadow rounded-lg p-6 w-full max-w-4xl mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">📄</span> Session Info
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <p><span className="font-medium">Session ID:</span> {userData.session.id}</p>
          <p><span className="font-medium">Created At:</span> {new Date(userData.session.createdAt).toLocaleString()}</p>
          <p><span className="font-medium">Expires At:</span> {new Date(userData.session.expiresAt).toLocaleString()}</p>
          <p><span className="font-medium">Max Age:</span> {Math.floor(userData.session.maxAge / 1000 / 60)} minutes</p>
          <p><span className="font-medium">Time Remaining:</span> {timeRemaining}</p>
        </div>
      </div>

      {/* Refresh Token */}
      <div className="bg-white shadow rounded-lg p-6 w-full max-w-4xl mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">🔐</span> Refresh Token
        </h2>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">This token is stored in httpOnly cookies (demo only).</div>
          <div className="p-3 bg-gray-900 text-gray-100 rounded font-mono text-xs break-all">
            {refreshToken || "No refresh token available"}
          </div>
          <div className="text-sm"><span className="font-medium">Countdown:</span> {timeRemaining}</div>
        </div>
      </div>

      {/* Login Logs */}
      <div className="bg-white shadow rounded-lg p-6 w-full max-w-4xl mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">🕒</span> Recent Login Attempts
        </h2>
        {logs.length === 0 ? (
          <p>No login attempts found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">IP</th>
                  <th className="p-2 border">User Agent</th>
                  <th className="p-2 border">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="text-center">
                    <td className={`p-2 border font-semibold ${log.success ? "text-green-600" : "text-red-600"}`}>
                      {log.success ? "✅ Success" : "❌ Failed"}
                    </td>
                    <td className="p-2 border">{log.ip}</td>
                    <td className="p-2 border">{log.userAgent}</td>
                    <td className="p-2 border">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button
          onClick={async () => {
            try {
              await api.delete("/auth/logs", { withCredentials: true });
              setLogs([]);
              toast.success("Logs cleared");
            } catch (err) {
              toast.error("Failed to clear logs");
            }
          }}
          className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Clear Logs
        </button>
      </div>

      <button
        onClick={handleLogout}
        className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg shadow hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
