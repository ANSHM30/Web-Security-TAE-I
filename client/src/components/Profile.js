import React, { useEffect, useState } from "react";
import api from "../api";

export default function Profile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get("/api/profile")
      .then((res) => setProfile(res.data))
      .catch((err) => console.error("Error fetching profile:", err));
  }, []);

  return (
    <div>
      <h2>Profile</h2>
      {profile ? (
        <pre>{JSON.stringify(profile, null, 2)}</pre>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
