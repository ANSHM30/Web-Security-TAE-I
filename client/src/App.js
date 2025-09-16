import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Profile from "./components/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0c1427] flex flex-col">
      <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
        <h1 className="text-6xl font-extrabold text-orange-500 mb-4">JWT Auth Demo</h1>
        <p className="text-lg text-white font-semibold">Stay Authenticated, Stay Secure</p>
      </div>
      <footer className="bg-[#0a1a2f] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-sm text-white/80">
          <p>© {new Date().getFullYear()} JWT Auth Demo. All rights reserved.</p>
          <div className="mt-3 sm:mt-0 flex gap-4">
            <a href="/login" className="text-orange-400 hover:text-orange-300">Login</a>
            <a href="/register" className="text-orange-400 hover:text-orange-300">Register</a>
            <a href="/dashboard" className="text-orange-400 hover:text-orange-300">Dashboard</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      {/* Navbar */}
      <nav className="bg-[#0c1427] px-6 py-4 flex justify-between items-center">
        {/* Title */}
        <span className="text-2xl font-bold text-orange-500">
          JWT Auth Demo
        </span>

        {/* Navigation Links */}
        <div className="flex gap-6 text-white font-semibold">
          <Link to="/register" className="hover:text-orange-400">
            Register
          </Link>
          <Link to="/login" className="hover:text-orange-400">
            Login
          </Link>
          <Link to="/profile" className="hover:text-orange-400">
            Profile
          </Link>
          <Link to="/dashboard" className="hover:text-orange-400">
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>

      {/* Toast notifications */}
      <ToastContainer position="top-right" autoClose={3000} />
    </BrowserRouter>
  );
}

export default App;
