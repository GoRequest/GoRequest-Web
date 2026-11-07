"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

export function AuthForm({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const credentials = { email: String(data.get("email")).trim(), password: String(data.get("password")) };
    setPending(true);
    setError("");
    setNotice("");
    try {
      if (mode === "signup") {
        await api.signup(credentials);
        setMode("login");
        setNotice("Account created. Sign in to open your workspace.");
        form.reset();
      } else {
        const { user } = await api.login(credentials);
        onAuthenticated(user);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      setError(error instanceof ApiError && error.status === 429 ? `${message} Please wait before trying again.` : message);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-5xl gap-12 py-12 lg:grid-cols-2 lg:items-center lg:py-24">
      <div>
        <span className="mb-5 block font-mono text-[11px] font-medium tracking-[0.2em] text-primary">A SMALL SPACE. ENDLESS POSSIBILITIES.</span>
        <h1 className="max-w-lg text-4xl font-medium leading-tight tracking-tight sm:text-5xl">A little clarity for<br /><span className="text-primary">every request.</span></h1>
        <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">Send a request. Explore the response. Get back to building. Your GoRequest workspace brings the essentials into one quiet place.</p>
        <div className="mt-9 flex gap-6 font-mono text-xs text-muted-foreground"><span><span className="text-primary">01</span> Compose</span><span><span className="text-primary">02</span> Send</span><span><span className="text-primary">03</span> Inspect</span></div>
      </div>
      <div className="glass-panel rounded-2xl border p-6 sm:p-9">
        <div className="galaxy-mark mb-6 flex size-10 items-center justify-center rounded-xl"><LockKeyhole size={19} /></div>
        <h2 className="text-xl font-semibold">{mode === "login" ? "Welcome to your workspace" : "Create your account"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{mode === "login" ? "Sign in to start testing your APIs." : "Use a unique password with at least 12 characters."}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2"><label className="text-sm font-medium" htmlFor="email">Email address</label><Input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required disabled={pending} /></div>
          <div className="space-y-2"><label className="text-sm font-medium" htmlFor="password">Password</label><Input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "signup" ? 12 : undefined} required disabled={pending} /></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {notice && <p role="status" className="text-sm text-primary">{notice}</p>}
          <Button className="h-11 w-full" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}{mode === "login" ? "Sign in" : "Create account"}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">{mode === "login" ? "New here?" : "Already have an account?"} <button type="button" disabled={pending} className="rounded text-primary underline-offset-4 hover:underline focus-visible:outline-2" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setNotice(""); }}>{mode === "login" ? "Create an account" : "Sign in"}</button></p>
      </div>
    </section>
  );
}
