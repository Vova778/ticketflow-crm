import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  Users,
  LogOut,
  ArrowUpRight,
  CircleHelp,
} from "lucide-react";
import { useAuth } from "../auth";
import { name, label } from "../types";
import { Avatar, Logo } from "./ui";
export function Layout() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="logo-link">
          <Logo />
        </NavLink>
        <div className="workspace-chip">
          <span className="workspace-mark">T</span>
          <div>
            Support workspace<small>TicketFlow CRM</small>
          </div>
          <span className="live-dot" />
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="Main navigation">
          <NavLink to="/" end>
            <LayoutDashboard size={19} /> Overview
          </NavLink>
          <NavLink to="/tickets">
            <Ticket size={19} /> Tickets
          </NavLink>
          {user.role === "ADMIN" && (
            <NavLink to="/users">
              <Users size={19} /> People
            </NavLink>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <CircleHelp size={19} />
            <strong>A little clarity goes a long way.</strong>
            <p>Keep the conversation and the next step in one place.</p>
            <NavLink to="/tickets/new">
              Start a conversation <ArrowUpRight size={14} />
            </NavLink>
          </div>
          <div className="profile">
            <Avatar user={user} />
            <div>
              <strong>{name(user)}</strong>
              <small>{label(user.role)}</small>
            </div>
            <button
              className="icon-button"
              aria-label="Sign out"
              title="Sign out"
              onClick={signOut}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-column">
        <div className="topbar">
          <span>
            Workspace <span className="slash">/</span>{" "}
            <strong>Customer support</strong>
          </span>
          <span className="topbar-right">
            <span className="live-dot" /> Let's make support feel simple{" "}
            <Avatar user={user} small />
          </span>
        </div>
        <main>
          <Outlet />
        </main>
        <footer>
          TicketFlow <span>Built for better conversations.</span>
          <span>Customer support, connected.</span>
        </footer>
      </div>
    </div>
  );
}
