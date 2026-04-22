import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutGrid,
  Users,
  GitBranch,
  Image as ImageIcon,
  UserCircle,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const overview = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/pipeline", label: "Pipeline", icon: GitBranch },
  { to: "/project-photos", label: "Project Photos", icon: ImageIcon },
] as const;

const account = [
  { to: "/partner-profile", label: "Partner Profile", icon: UserCircle },
] as const;

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
      <div className="mb-6 flex items-center gap-3 px-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-md">
          BP
        </div>
        <span className="text-base font-semibold text-sidebar-foreground">Brand Partner</span>
      </div>

      <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Overview
      </p>
      <nav className="flex flex-col gap-1">
        {overview.map((i) => (
          <NavItem key={i.to} {...i} active={pathname === i.to} />
        ))}
      </nav>

      <p className="mb-2 mt-6 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Account
      </p>
      <nav className="flex flex-col gap-1">
        {account.map((i) => (
          <NavItem key={i.to} {...i} active={pathname === i.to} />
        ))}
        <button
          onClick={handleLogout}
          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </nav>
    </aside>
  );
}
