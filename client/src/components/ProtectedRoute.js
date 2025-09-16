import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";

function UnauthRedirect() {
  useEffect(() => {
    toast.warning("Please login to access this page.");
  }, []);
  return <Navigate to="/login" replace />;
}

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");
  return token ? children : <UnauthRedirect />;
}
