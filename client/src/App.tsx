import { useState } from "react";
import { Routes, Route, NavLink, useNavigate, Navigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { Home } from "./pages/Home";
import { Agents } from "./pages/Agents";
import { AgentDetail } from "./pages/AgentDetail";
import { API } from "./pages/API";

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    (localStorage.getItem("theme") as "dark" | "light") ?? "dark"
  );
  const navigate = useNavigate();

  const toggleTheme = () => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      return next;
    });
  };

  return (
    <div className={`app-root${theme === "light" ? " light" : ""}`}>
      <nav className="top-nav">
        <div
          className="nav-logo"
          aria-label="Copilot Apple"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Leaf */}
            <path d="M14 5 C14 5 15 2 18 2" stroke="#4caf50" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Apple body */}
            <path d="M14 6 C9 6 5 10 5 15 C5 20.5 8.5 24 12 24 C12.8 24 13.5 23.7 14 23.5 C14.5 23.7 15.2 24 16 24 C19.5 24 23 20.5 23 15 C23 10 19 6 14 6 Z" fill="#e53935" />
            {/* Apple shine */}
            <ellipse cx="10" cy="11" rx="2" ry="1.2" fill="rgba(255,255,255,0.3)" transform="rotate(-20 10 11)" />
            {/* Left eye */}
            <ellipse cx="11" cy="16" rx="1.5" ry="1.8" fill="white" />
            <circle cx="11.4" cy="16.2" r="0.8" fill="#1a1a1a" />
            {/* Right eye */}
            <ellipse cx="17" cy="16" rx="1.5" ry="1.8" fill="white" />
            <circle cx="17.4" cy="16.2" r="0.8" fill="#1a1a1a" />
            {/* Smile */}
            <path d="M11.5 20 Q14 22 16.5 20" stroke="#1a1a1a" strokeWidth="1" strokeLinecap="round" fill="none" />
          </svg>
          <span className="nav-brand">Copilot Apple</span>
        </div>
        <div className="nav-tabs">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
          >
            Chat
          </NavLink>
          <NavLink
            to="/agents"
            className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
          >
            Agents
          </NavLink>
          <NavLink
            to="/api"
            className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
          >
            API
          </NavLink>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </nav>

      <Routes>
        <Route path="/" element={<div className="layout"><Home /></div>} />
        <Route path="/agents" element={<div className="layout agents-mode"><Agents /></div>} />
        <Route path="/agents/:id" element={<div className="layout agents-mode"><AgentDetail /></div>} />
        <Route path="/api" element={<div className="layout agents-mode"><API /></div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
