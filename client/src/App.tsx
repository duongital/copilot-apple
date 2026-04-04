import { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { ChatTab } from "./components/ChatTab";
import { AgentsTab } from "./components/AgentsTab";

export default function App() {
  const [tab, setTab] = useState<"chat" | "agents">("chat");
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    (localStorage.getItem("theme") as "dark" | "light") ?? "dark"
  );

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
        <div className="nav-tabs">
          <button
            className={`nav-tab ${tab === "chat" ? "active" : ""}`}
            onClick={() => setTab("chat")}
          >Chat</button>
          <button
            className={`nav-tab ${tab === "agents" ? "active" : ""}`}
            onClick={() => setTab("agents")}
          >Agents</button>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </nav>

      <div className={`layout${tab === "agents" ? " agents-mode" : ""}`}>
        {tab === "chat" ? <ChatTab /> : <AgentsTab />}
      </div>
    </div>
  );
}
