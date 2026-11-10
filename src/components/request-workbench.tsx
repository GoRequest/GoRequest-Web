"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  CircleStop,
  Clock3,
  LoaderCircle,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api/client";
import {
  HTTP_METHODS,
  type ExecuteResponse,
  type HttpMethod,
} from "@/lib/api/types";

function prettyBody(body: string) {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

export function RequestWorkbench({
  onSessionExpired,
}: {
  onSessionExpired: () => void;
}) {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("https://httpbin.org/get");
  const [headers, setHeaders] = useState([{ id: 0, key: "", value: "" }]);
  const [body, setBody] = useState("");
  const [timeout, setTimeoutMs] = useState(30000);
  const [response, setResponse] = useState<ExecuteResponse | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const nextId = useRef(1);

  useEffect(() => () => controller.current?.abort(), []);

  async function execute(event: FormEvent) {
    event.preventDefault();
    if (controller.current) return;
    if (!Number.isInteger(timeout) || timeout < 1 || timeout > 60000) {
      setError(
        "Timeout must be a whole number between 1 and 60,000 milliseconds.",
      );
      return;
    }
    const requestHeaders: Record<string, string> = {};
    const seen = new Set<string>();
    for (const header of headers) {
      const key = header.key.trim();
      if (!key && !header.value) continue;
      if (!key) {
        setError("Each header value needs a header name.");
        return;
      }
      if (seen.has(key.toLowerCase())) {
        setError(`Remove the duplicate header: ${key}.`);
        return;
      }
      seen.add(key.toLowerCase());
      Object.defineProperty(requestHeaders, key, {
        value: header.value,
        enumerable: true,
        configurable: true,
      });
    }
    const abort = new AbortController();
    controller.current = abort;
    setPending(true);
    setError("");
    setResponse(null);
    try {
      const result = await api.execute(
        {
          method,
          url: url.trim(),
          headers: requestHeaders,
          body,
          timeout_ms: timeout,
        },
        abort.signal,
      );
      setResponse(result);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }
      setError(
        abort.signal.aborted
          ? "Stopped waiting for the response. The server may still finish the request."
          : error instanceof Error
            ? error.message
            : "Request failed.",
      );
    } finally {
      controller.current = null;
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-primary">
            Workspace
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Make your next request.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Compose, send, and see exactly what comes back.
          </p>
        </div>
        <span className="hidden rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:block">
          HTTP / HTTPS
        </span>
      </div>
      <section
        className="glass-panel overflow-hidden rounded-xl border"
        aria-label="Request editor"
      >
        <div className="flex items-center gap-2 border-b px-5 py-3 text-sm font-medium">
          <span className="size-1.5 rounded-full bg-primary" />
          Untitled request
        </div>
        <form
          onSubmit={execute}
          className="space-y-5 p-5"
        >
          <div className="flex flex-wrap gap-3">
            <label
              className="sr-only"
              htmlFor="method"
            >
              HTTP method
            </label>
            <select
              id="method"
              value={method}
              onChange={(event) => setMethod(event.target.value as HttpMethod)}
              disabled={pending}
              className="h-11 rounded-md border bg-secondary px-3 font-mono text-sm font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {HTTP_METHODS.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
            <label
              className="sr-only"
              htmlFor="url"
            >
              Request URL
            </label>
            <Input
              id="url"
              type="url"
              required
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              disabled={pending}
              placeholder="https://api.example.com"
              className="h-11 min-w-40 flex-1 font-mono"
            />
            <Button
              type="submit"
              disabled={pending}
              className="h-11 px-6"
            >
              {pending ? <LoaderCircle className="animate-spin" /> : <Send />}
              Send request
            </Button>
            {pending && (
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => controller.current?.abort()}
              >
                <CircleStop />
                Cancel
              </Button>
            )}
          </div>
          <Tabs defaultValue="headers">
            <TabsList>
              <TabsTrigger value="headers">
                Headers
                {headers.some((header) => header.key)
                  ? ` (${headers.filter((header) => header.key).length})`
                  : ""}
              </TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent
              value="headers"
              className="space-y-3"
            >
              <p className="text-xs text-muted-foreground">
                Add destination headers here, including Authorization for bearer
                tokens.
              </p>
              {headers.map((header, index) => (
                <div
                  key={header.id}
                  className="flex gap-2"
                >
                  <Input
                    aria-label={`Header ${index + 1} name`}
                    placeholder="Header name"
                    value={header.key}
                    disabled={pending}
                    onChange={(event) =>
                      setHeaders(
                        headers.map((row) =>
                          row.id === header.id
                            ? { ...row, key: event.target.value }
                            : row,
                        ),
                      )
                    }
                    className="font-mono"
                  />
                  <Input
                    aria-label={`Header ${index + 1} value`}
                    placeholder="Value"
                    value={header.value}
                    disabled={pending}
                    onChange={(event) =>
                      setHeaders(
                        headers.map((row) =>
                          row.id === header.id
                            ? { ...row, value: event.target.value }
                            : row,
                        ),
                      )
                    }
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove header ${index + 1}`}
                    disabled={pending}
                    onClick={() =>
                      setHeaders(headers.filter((row) => row.id !== header.id))
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() =>
                  setHeaders([
                    ...headers,
                    { id: nextId.current++, key: "", value: "" },
                  ])
                }
              >
                <Plus />
                Add header
              </Button>
            </TabsContent>
            <TabsContent value="body">
              <label
                htmlFor="body"
                className="mb-3 block text-xs text-muted-foreground"
              >
                Raw request body. Set the appropriate Content-Type in Headers.
              </label>
              <Textarea
                id="body"
                value={body}
                disabled={pending}
                onChange={(event) => setBody(event.target.value)}
                placeholder={'{\n  "message": "hello"\n}'}
                className="min-h-40 font-mono"
                spellCheck={false}
              />
            </TabsContent>
            <TabsContent
              value="settings"
              className="space-y-2"
            >
              <label
                htmlFor="timeout"
                className="text-sm font-medium"
              >
                Timeout (milliseconds)
              </label>
              <Input
                id="timeout"
                type="number"
                min={1}
                max={60000}
                step={1}
                required
                value={timeout}
                disabled={pending}
                onChange={(event) => setTimeoutMs(Number(event.target.value))}
                className="max-w-60"
              />
              <p className="text-xs text-muted-foreground">
                Between 1 and 60,000 ms, including response download time.
              </p>
            </TabsContent>
          </Tabs>
        </form>
      </section>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/25 bg-card p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <section
        aria-label="Response"
        aria-busy={pending}
        className="glass-panel overflow-hidden rounded-xl border"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <h2 className="text-sm font-medium">Response</h2>
          {response && (
            <div
              role="status"
              className="flex flex-wrap items-center gap-4 font-mono text-xs"
            >
              <span
                className={`rounded-md px-2 py-1 ${response.status_code < 400 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}
              >
                {response.status}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock3 size={13} />
                {response.duration_ms.toFixed(2)} ms
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <ArrowDownToLine size={13} />
                {response.size_bytes.toLocaleString()} B
              </span>
            </div>
          )}
        </div>
        {response ? (
          <Tabs
            defaultValue="body"
            className="p-5"
          >
            <TabsList>
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="headers">Headers</TabsTrigger>
            </TabsList>
            <TabsContent value="body">
              <pre className="max-h-[32rem] overflow-auto rounded-md bg-background p-4 font-mono text-xs leading-6">
                {response.body ? prettyBody(response.body) : "(empty body)"}
              </pre>
            </TabsContent>
            <TabsContent value="headers">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <caption className="sr-only">Response headers</caption>
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 font-medium">Name</th>
                      <th className="p-3 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(response.headers ?? {}).flatMap(
                      ([key, values]) =>
                        values.map((value, index) => (
                          <tr
                            key={`${key}-${index}`}
                            className="border-b last:border-0"
                          >
                            <td className="p-3 align-top font-mono">{key}</td>
                            <td className="break-all p-3 font-mono">{value}</td>
                          </tr>
                        )),
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
              {pending ? (
                <LoaderCircle
                  size={20}
                  className="animate-spin"
                />
              ) : (
                <ArrowRight size={20} />
              )}
            </span>
            <p
              role="status"
              className="text-sm font-medium"
            >
              {pending
                ? "Waiting for a response…"
                : "Your response will appear here"}
            </p>
            <p className="max-w-sm text-xs leading-5 text-muted-foreground">
              {pending
                ? "GoRequest is executing your request."
                : "Send a request to inspect its status, timing, headers, and body."}
            </p>
          </div>
        )}
      </section>
      <p className="text-xs leading-5 text-muted-foreground">
        Public destinations only. Responses are limited to 5 MiB. Redirects are
        returned without being followed.
      </p>
    </div>
  );
}
