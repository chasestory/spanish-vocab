import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Today", icon: "●" },
  { to: "/study", label: "Study", icon: "▸" },
  { to: "/explore", label: "Explore", icon: "⌕" },
  { to: "/progress", label: "Progress", icon: "▣" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

export function Shell({ children }: { children: ReactNode }) {
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
          <span className="muted">Spanish, by frequency</span>
        </div>
        {children}
      </div>
      <nav className="tabbar" aria-label="Primary">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === "/"} className={({ isActive }) => `tab${isActive ? " active" : ""}`}>
            <span aria-hidden="true">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
