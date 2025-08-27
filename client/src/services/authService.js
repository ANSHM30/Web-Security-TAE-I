// src/services/authService.js
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";

const API_URL = "http://localhost:4000/api";

// ======== Local Storage Helpers ========
function setAccessToken(token) {
  localStorage.setItem("accessToken", token);
}

function getAccessToken() {
  return localStorage.getItem("accessToken");
}

function clearAccessToken() {
  localStorage.removeItem("accessToken");
}

// ======== AUTH API CALLS ========
export async function login(email, password) {
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
}

export async function register(email, password) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error("Registration failed");
  return res.json();
}

export function logout() {
  clearAccessToken();
  toast.info("Logged out");
}

export function getUser() {
  const token = getAccessToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (err) {
    return null;
  }
}

// ======== REFRESH TOKEN LOGIC ========
async function refreshAccessToken() {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include", // send cookies
  });

  if (!res.ok) {
    logout();
    toast.error("Session expired. Please log in again.");
    throw new Error("Refresh token expired");
  }

  const data = await res.json();
  setAccessToken(data.accessToken);
  return data.accessToken;
}

// ======== FETCH WITH AUTO-REFRESH ========
export async function fetchWithAuth(url, options = {}) {
  let token = getAccessToken();

  if (!token) {
    toast.error("You must log in first");
    throw new Error("No access token");
  }

  // attach Authorization header
  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  let res = await fetch(url, options);

  // If token expired, try refresh
  if (res.status === 401) {
    try {
      token = await refreshAccessToken();

      // retry request with new token
      options.headers.Authorization = `Bearer ${token}`;
      res = await fetch(url, options);
    } catch (err) {
      throw err; // handled above
    }
  }

  return res;
}

// Export helpers if needed elsewhere
export { getAccessToken };
