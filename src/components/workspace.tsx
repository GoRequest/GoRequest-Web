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
  const [online, setOnline] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadSession = useCallback((signal?: AbortSignal) => {
    return api.me(signal)
      .then(({ user }) => {
        if (signal?.aborted) return;
        setError("");
        setUser(user);
        setOnline(true);
      })
      .catch((error: unknown) => {
        if (signal?.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          setError("");
          setUser(null);
          setOnline(true);
        } else {
          setError(error instanceof Error ? error.message : "Unable to load your session.");
          setOnline(false);
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
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex min-h-18 max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight"><span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Braces size={21} /></span><span className="text-lg">GoRequest<span className="font-normal text-muted-foreground"> / web</span></span></Link>
          <div className="flex items-center gap-4">
            <span role="status" className="flex items-center gap-2 text-xs text-muted-foreground"><span className={`size-1.5 rounded-full ${online ? "bg-primary" : "bg-muted-foreground"}`} />{loading ? "Connecting" : online ? "API connected" : "API unavailable"}</span>
            {user && <><span className="hidden max-w-60 truncate text-sm text-muted-foreground sm:block">{user.email}</span><Button variant="ghost" size="sm" onClick={logout} disabled={loggingOut}><LogOut />Sign out</Button></>}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8">
        {error && <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/25 bg-card p-4 text-sm"><p className="text-destructive">{error}</p><Button variant="outline" size="sm" onClick={() => { setLoading(true); setError(""); void loadSession(); }}>Retry connection</Button></div>}
        {loading ? <div className="flex min-h-96 items-center justify-center gap-3 text-sm text-muted-foreground"><LoaderCircle size={18} className="animate-spin" />Opening your workspace…</div> : user ? <RequestWorkbench onSessionExpired={() => { setUser(null); setError("Your session expired. Sign in again to continue."); }} /> : <AuthForm onAuthenticated={(user) => { setUser(user); setOnline(true); setError(""); }} />}
      </main>
      <footer className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 border-t px-5 py-5 text-xs text-muted-foreground sm:px-8"><span>GoRequest · A focused space for your APIs.</span><a href="https://github.com/MarlonBBo/GoRequest" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">Open source, built with Go<ArrowUpRight size={13} /></a></footer>
    </div>
  );
}
