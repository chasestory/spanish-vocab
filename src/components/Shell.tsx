import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home", icon: "⌂" },
  { to: "/study", label: "Study", icon: "▸" },
  { to: "/words", label: "Words", icon: "≡" },
  { to: "/phrases", label: "Phrases", icon: "“" },
  { to: "/drill", label: "Drill", icon: "✎" },
  { to: "/saved", label: "Saved", icon: "★" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

export function Shell({ children }: { children: ReactNode }) {
  const [more, setMore] = useState(false);
  return (
    <div className="shell">
      <aside className="side">
        <p className="wordmark" style={{ padding: "6px 12px 14px" }}>Raíz</p>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
            <span aria-hidden="true">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </aside>
      <div className="main">
        <div className="brand">
          <p className="wordmark">Raíz</p>
          <span className="muted">for Chase</span>
        </div>
        {children}
      </div>
      <nav className="tabbar" aria-label="Primary">
        {links.slice(0, 4).map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === "/"} className={({ isActive }) => `tab${isActive ? " active" : ""}`} onClick={() => setMore(false)}>
            <span aria-hidden="true">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
        <button className={`tab${more ? " active" : ""}`} type="button" onClick={() => setMore((open) => !open)} aria-expanded={more}>
          <span aria-hidden="true">⋯</span>
          More
        </button>
      </nav>
      {more && (
        <div className="more-sheet">
          {links.slice(4).map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setMore(false)}>
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
