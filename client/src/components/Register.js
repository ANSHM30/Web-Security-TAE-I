import axios from "axios";
import { useState } from "react";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:4000/auth/register",
        { email, password },
        { withCredentials: true }  // important if you’re using cookies
      );
      console.log("✅ Registered:", res.data);
      alert("Registration successful!");
    } catch (err) {
      console.error("❌ Error during register:", err);
      alert("Registration failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
      <button type="submit">Register</button>
    </form>
  );
}

export default Register;
