import { ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/lib/auth";

export function AppShell({ children }: { children: ReactNode }) {
  const { token, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !token) navigate({ to: "/login", replace: true });
  }, [ready, token, navigate]);

  // Wait for client hydration before deciding what to show
  if (!ready) return null;
  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-end gap-3 border-b border-border bg-background/60 px-6 py-3 backdrop-blur">
          <ThemeToggle />
        </header>
        <main className="flex flex-1 flex-col p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
