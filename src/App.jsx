// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { account } from "./lib/appwrite.js";

function App() {
  console.log("App component rendered");
  const [user, setUser] = useState(null);          // null = not logged in
  const [isCheckingSession, setIsCheckingSession] = useState(true); // loading flag

  // Check if user is already logged in when app loads
  useEffect(() => {
    const checkSession = async () => {
      try {
        const current = await account.get(); // throws if no session
        setUser(current);
      } catch (err) {
        setUser(null);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  // Called from Login.jsx
  const handleLogin = async (email, password) => {
    // Create a session
    await account.createEmailPasswordSession(email, password);
    // Fetch user info
    const current = await account.get();
    setUser(current);
  };

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
    } catch (err) {
      console.error("Logout error:", err);
    }
    setUser(null);
  };

  // While we’re checking existing session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600 text-sm">Checking session...</p>
      </div>
    );
  }

  const isLoggedIn = !!user;

  return (
    <Routes>
      {/* Login page */}
      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />

      {/* Dashboard page */}
      <Route
        path="/dashboard"
        element={
          isLoggedIn ? (
            <Dashboard onLogout={handleLogout} user={user} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Default route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
