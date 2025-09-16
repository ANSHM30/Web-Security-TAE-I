import React, { useEffect, useState } from "react";
import api from "../api";
import { jwtDecode } from "jwt-decode";
// Access token will be fetched from backend via /auth/refresh

function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await api.get("/api/profile", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }); // ✅ secure API call
        setProfile(res.data?.user || res.data);
      } catch (err) {
        console.error("Error fetching profile:", err);

        if (err.response?.status === 401) {
          setError("⚠️ Please login first to view your profile.");
        } else {
          setError(err.response?.data?.message || "Something went wrong. Try again later.");
        }
      }
    };

    // Fetch a fresh access token from backend (uses refresh token cookie)
    api
      .post("/auth/refresh")
      .then((res) => {
        const token = res.data?.accessToken || "";
        setAccessToken(token);
        if (token) {
          localStorage.setItem("accessToken", token);
        }
      })
      .catch(() => setAccessToken(""))
      .finally(() => {
        fetchProfile();
      });
  }, []);

  // Compute and display countdown to access token expiry
  useEffect(() => {
    function computeTimeLeft(token) {
      try {
        const decoded = jwtDecode(token);
        const seconds = Math.max(0, Math.floor(decoded.exp * 1000 - Date.now()) / 1000);
        return Math.floor(seconds);
      } catch {
        return null;
      }
    }

    // Initialize from current token (state or localStorage fallback)
    const initialToken = accessToken || localStorage.getItem("accessToken");
    setTimeLeft(initialToken ? computeTimeLeft(initialToken) : null);

    const interval = setInterval(() => {
      const current = localStorage.getItem("accessToken") || accessToken;
      if (!current) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft(computeTimeLeft(current));
    }, 1000);

    return () => clearInterval(interval);
  }, [accessToken]);

  // Proactively refresh token a few seconds before expiry (no page reload)
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft > 5) return; // refresh when <= 5s left
    if (refreshing) return;

    setRefreshing(true);
    api
      .post("/auth/refresh")
      .then((res) => {
        const token = res.data?.accessToken || "";
        if (token) {
          localStorage.setItem("accessToken", token);
          setAccessToken(token);
        }
      })
      .catch(() => {
        // do nothing here; next protected call will redirect via interceptor
      })
      .finally(() => setRefreshing(false));
  }, [timeLeft, refreshing]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-md w-96 text-center">
          <p className="text-red-500 font-semibold">{error}</p>
          <a
            href="/login"
            className="mt-4 inline-block bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c1427] via-[#101a34] to-[#0c1427]">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <h2 className="text-3xl font-bold text-white">
              Your Profile
            </h2>
            <p className="text-indigo-100 mt-2">Manage your account information</p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Info Card */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">👤</span>
                  Account Details
                </h3>
                <div className="space-y-4">
                  {(profile.id || profile._id) && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">User ID</label>
                      <p className="text-gray-900 font-mono text-sm break-all">{profile.id || profile._id}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Username</label>
                    <p className="text-gray-900 font-medium">{profile.name || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <p className="text-gray-900 font-medium">{profile.email}</p>
                  </div>
                  {(profile.joined || profile.joinedAt || profile.createdAt) && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Member Since</label>
                      <p className="text-gray-900">{new Date(profile.joined || profile.joinedAt || profile.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Token Info Card */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">🔐</span>
                  Security
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Token Status</label>
                    <div className="flex items-center mt-1">
                      <div className={`w-3 h-3 rounded-full mr-2 ${timeLeft !== null && timeLeft > 10 ? 'bg-green-500' : timeLeft !== null && timeLeft > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      <span className="text-gray-900 font-medium">
                        {timeLeft !== null ? `${timeLeft}s remaining` : "Not available"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Access Token</label>
                    <div className="mt-1 p-3 bg-gray-900 text-gray-100 rounded-lg font-mono text-xs break-all">
                      {accessToken || "Not available"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Refresh Status */}
            {refreshing && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-800 font-medium">Refreshing token...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
