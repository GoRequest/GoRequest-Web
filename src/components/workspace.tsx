"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  BookOpen,
  Code2,
  LoaderCircle,
  LogOut,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { GitHubSignInButton } from "@/components/github-sign-in-button";
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
    return api
      .me(signal)
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
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load your session.",
          );
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
    try {
      await api.logout();
      setUser(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not sign out. Try again.",
      );
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="workspace-shell">
      <a
        className="skip-link"
        href="#workspace"
      >
        Skip to workspace
      </a>
      <header className="workspace-header">
        <div className="header-brand">
          <Link
            href="/"
            className="brand-link"
          >
            <Image
              src="/icon.svg"
              alt=""
              width={32}
              height={32}
              unoptimized
              className="shrink-0"
            />
            <span>
              GoRequest<span className="brand-period">.</span>
            </span>
          </Link>
          <span
            className="header-divider"
            aria-hidden="true"
          />
          <span className="header-context">Personal workspace</span>
        </div>
        <div className="header-actions">
          <a
            className="documentation-link"
            href="https://github.com/MarlonBBo/GoRequest#readme"
            target="_blank"
            rel="noreferrer"
          >
            <BookOpen size={16} /> Documentation <ArrowUpRight size={14} />
          </a>
          {!loading &&
            (user ? (
              <>
                <span className="hidden max-w-60 truncate text-sm text-muted-foreground sm:block">
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  disabled={loggingOut}
                >
                  <LogOut />
                  Sign out
                </Button>
              </>
            ) : (
              <GitHubSignInButton />
            ))}
        </div>
      </header>
      <div className="workspace-body">
        <aside
          className="workspace-sidebar"
          aria-label="Workspace navigation"
        >
          <div>
            <p className="sidebar-label">Workspace</p>
            <a
              className="sidebar-link is-active"
              href="#workspace"
              aria-current="page"
            >
              <Terminal size={17} /> HTTP client{" "}
              <span className="sidebar-indicator" />
            </a>
            <a
              className="sidebar-link"
              href="https://github.com/GoRequest"
              target="_blank"
              rel="noreferrer"
            >
              <Code2 size={17} /> Source code{" "}
              <ArrowUpRight
                size={14}
                className="ml-auto"
              />
            </a>
          </div>
          <div className="sidebar-note">
            <ShieldCheck size={19} />
            <p>Built for public APIs</p>
            <span>
              HTTP and HTTPS requests.
              <br />
              Your session stays with GoRequest.
            </span>
          </div>
        </aside>
        <main
          id="workspace"
          className="workspace-main"
          tabIndex={-1}
        >
          {error && (
            <div
              role="alert"
              className="connection-alert"
            >
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoading(true);
                  setError("");
                  void loadSession();
                }}
              >
                Retry connection
              </Button>
            </div>
          )}
          {loading ? (
            <div className="flex min-h-96 items-center justify-center gap-3 text-sm text-muted-foreground">
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
              Opening your workspace…
            </div>
          ) : (
            <RequestWorkbench
              onSessionExpired={() => {
                setUser(null);
                setError(
                  "The API requires authentication for this request. Sign in with GitHub and try again.",
                );
              }}
            />
          )}
          <footer className="workspace-footer">
            <span>
              <span
                className="footer-mark"
                aria-hidden="true"
              >
                ↗
              </span>{" "}
              GoRequest <span className="footer-separator">/</span> HTTP API
              testing
            </span>
            <a
              href="https://github.com/GoRequest"
              target="_blank"
              rel="noreferrer"
              className="footer-link"
            >
              Open source · Built with Go
              <ArrowUpRight size={13} />
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}
