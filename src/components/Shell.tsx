import { useEffect, type ReactNode } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Today", icon: "home" },
  { to: "/study", label: "Study", icon: "cards" },
  { to: "/explore", label: "Explore", icon: "search" },
  { to: "/progress", label: "Progress", icon: "chart" },
  { to: "/settings", label: "Settings", icon: "gear" },
];

function Icon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "home") return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" /></svg>;
  if (name === "cards") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect {...common} x="6" y="4" width="12" height="16" rx="2" /><path {...common} d="M9 9h6M9 13h4" /></svg>;
  if (name === "search") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle {...common} cx="11" cy="11" r="6" /><path {...common} d="m16 16 4 4" /></svg>;
  if (name === "chart") return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M5 19V10M12 19V5M19 19v-7" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle {...common} cx="12" cy="12" r="3" /><path {...common} d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></svg>;
}

export function Shell({ children }: { children: ReactNode }) {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const sync = () => {
      const overlap = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      document.documentElement.style.setProperty("--kb", `${Math.round(overlap)}px`);
      document.documentElement.classList.toggle("keyboard", overlap > 80);
    };
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    sync();
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
    };
  }, []);

  return (
    <div className="shell">
      <aside className="side">
        <p className="wordmark" style={{ padding: "6px 12px 14px" }}>Raíz</p>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
            <Icon name={link.icon} />
            {link.label}
          </NavLink>
        ))}
      </aside>
      <div className="main">
        {children}
      </div>
      <nav className="tabbar" aria-label="Primary">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === "/"} className={({ isActive }) => `tab${isActive ? " active" : ""}`}>
            <Icon name={link.icon} />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
