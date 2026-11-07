"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Braces, LoaderCircle, LogOut } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { RequestWorkbench } from "@/components/request-workbench";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

export function Workspace() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const loadSession = useCallback((signal?: AbortSignal) => {
    return api.me(signal)
      .then(({ user }) => {
        if (signal?.aborted) return;
        setError("");
        setUser(user);
      })
      .catch((error: unknown) => {
        if (signal?.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          setError("");
          setUser(null);
        } else {
          setError(error instanceof Error ? error.message : "Unable to load your session.");
        }
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadSession(controller.signal);
    return () => controller.abort();
  }, [loadSession]);

  async function logout() {
    setLoggingOut(true);
    setError("");
    try { await api.logout(); setUser(null); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not sign out. Try again."); }
    finally { setLoggingOut(false); }
  }

  return (
    <div className="galaxy-shell flex min-h-screen flex-col">
      <div className="galaxy-particles" aria-hidden="true">
        {Array.from({ length: 32 }, (_, index) => (
          <span key={index} style={{
            left: `${(index * 37 + 7) % 100}%`,
            top: `${(index * 23 + 11) % 100}%`,
            width: index % 5 === 0 ? 3 : 2,
            height: index % 5 === 0 ? 3 : 2,
            animationDelay: `${-index * 1.7}s`,
            animationDuration: `${18 + (index % 7) * 3}s`,
          }} />
        ))}
      </div>
      <header className="glass-header border-b">
        <div className="mx-auto flex min-h-18 max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight"><span className="galaxy-mark flex size-9 items-center justify-center rounded-lg"><Braces size={21} /></span><span className="text-lg">GoRequest<span className="font-normal text-muted-foreground"> / web</span></span></Link>
          <div className="flex items-center gap-4">
            {user && <><span className="hidden max-w-60 truncate text-sm text-muted-foreground sm:block">{user.email}</span><Button variant="ghost" size="sm" onClick={logout} disabled={loggingOut}><LogOut />Sign out</Button></>}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8">
        {error && <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/25 bg-card p-4 text-sm"><p className="text-destructive">{error}</p><Button variant="outline" size="sm" onClick={() => { setLoading(true); setError(""); void loadSession(); }}>Retry connection</Button></div>}
        {loading ? <div className="flex min-h-96 items-center justify-center gap-3 text-sm text-muted-foreground"><LoaderCircle size={18} className="animate-spin" />Opening your workspace…</div> : user ? <RequestWorkbench onSessionExpired={() => { setUser(null); setError("Your session expired. Sign in again to continue."); }} /> : <AuthForm onAuthenticated={(user) => { setUser(user); setError(""); }} />}
      </main>
      <footer className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 border-t px-5 py-5 text-xs text-muted-foreground sm:px-8"><span>GoRequest · A focused space for your APIs.</span><a href="https://github.com/MarlonBBo/GoRequest" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">Open source, built with Go<ArrowUpRight size={13} /></a></footer>
    </div>
  );
}
