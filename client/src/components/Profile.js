import React, { useEffect, useState } from "react";
import api from "../api";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/profile"); // ✅ secure API call
        setProfile(res.data);
      } catch (err) {
        console.error("Error fetching profile:", err);

        if (err.response?.status === 401) {
          setError("⚠️ Please login first to view your profile.");
        } else {
          setError("Something went wrong. Try again later.");
        }
      }
    };

    fetchProfile();
  }, []);

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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          Your Profile
        </h2>

        <div className="space-y-3 text-gray-700">
          <p>
            <span className="font-semibold">👤 Name:</span> {profile.name}
          </p>
          <p>
            <span className="font-semibold">📧 Email:</span> {profile.email}
          </p>
          <p className="break-words">
            <span className="font-semibold">🔑 Password Hash:</span>{" "}
            {profile.passwordHash}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Profile;
