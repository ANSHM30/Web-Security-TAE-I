// src/services/authService.js
import { useEffect, useState } from "react";
import {jwtDecode} from "jwt-decode";
import { toast } from "react-toastify";

const API_URL = "http://localhost:4000/api";

// ======== Local Storage Helpers ========
const setAccessToken = (token) => localStorage.setItem("accessToken", token);
const getAccessToken = () => localStorage.getItem("accessToken");
const clearAccessToken = () => localStorage.removeItem("accessToken");

// ======== AUTH API CALLS ========
const login = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include", // send cookies for refresh token
  });

  if (!res.ok) throw new Error("Login failed");
  const data = await res.json();
  setAccessToken(data.accessToken);
  return data;
};

const register = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Registration failed");
  return res.json();
};

const logout = () => {
  clearAccessToken();
  toast.info("Logged out");
};

const getUser = () => {
  const token = getAccessToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
};

// ======== REFRESH TOKEN LOGIC ========
const refreshAccessToken = async () => {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    logout();
    toast.error("Session expired. Please log in again.");
    throw new Error("Refresh token expired");
  }

  const data = await res.json();
  setAccessToken(data.accessToken);
  return data.accessToken;
};

// ======== FETCH WITH AUTO-REFRESH ========
const fetchWithAuth = async (url, options = {}) => {
  let token = getAccessToken();
  if (!token) {
    toast.error("You must log in first");
    throw new Error("No access token");
  }

  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  let res = await fetch(url, options);

  if (res.status === 401) {
    try {
      token = await refreshAccessToken();
      options.headers.Authorization = `Bearer ${token}`;
      res = await fetch(url, options);
    } catch (err) {
      throw err;
    }
  }

  return res;
};

// ======== SESSION HOOK (for countdown & auto-refresh) ========
export function useSession() {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch {
      logout();
      window.location.reload(); // refresh immediately if token invalid
      return;
    }

    const expiryTime = decoded.exp * 1000;

    const interval = setInterval(async () => {
      const now = Date.now();
      const diff = expiryTime - now;

      if (diff <= 0) {
        clearInterval(interval);
        logout();
        window.location.reload(); // refresh page on expiry
      } else if (diff < 60000) {
        // Refresh token 1 minute before expiry
        try {
          await fetchWithAuth(`${API_URL}/auth/refresh`, { method: "POST" });
          const newToken = getAccessToken();
          const newDecoded = jwtDecode(newToken);
          setTimeLeft(Math.floor((newDecoded.exp * 1000 - Date.now()) / 1000));
        } catch {
          logout();
          window.location.reload(); // refresh page if refresh failed
        }
      } else {
        setTimeLeft(Math.floor(diff / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}


// ======== EXPORTS ========
export {
  login,
  register,
  logout,
  getUser,
  getAccessToken,
  fetchWithAuth,
  refreshAccessToken,
};
