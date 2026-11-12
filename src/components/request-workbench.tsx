"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  CircleStop,
  Clock3,
  Code2,
  CornerDownLeft,
  FileJson,
  Globe2,
  LoaderCircle,
  Plus,
  Send,
  ShieldCheck,
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
    <div className="workbench">
      <div className="workbench-heading">
        <div>
          <p className="workspace-breadcrumb">
            Workspace <span>/</span> HTTP client
          </p>
          <h1>Your API workspace.</h1>
          <p className="workbench-description">
            Send a request. Get the full response.
          </p>
        </div>
        <span className="protocol-label">
          <Globe2 size={15} /> HTTP / HTTPS
        </span>
      </div>
      <div
        className="request-window app-frame"
        aria-label="Request editor"
      >
        <div className="window-titlebar">
          <div className="request-document">
            <span className="method-label">{method}</span> Untitled request{" "}
            <span
              className="unsaved-dot"
              aria-label="Unsaved request"
            />
          </div>
          <span className="window-caption">
            Request builder <Code2 size={15} />
          </span>
        </div>
        <form
          onSubmit={execute}
          className="request-form"
        >
          <div className="request-address">
            <div className="method-field">
              <label
                className="field-label"
                htmlFor="method"
              >
                Method
              </label>
              <select
                id="method"
                value={method}
                onChange={(event) =>
                  setMethod(event.target.value as HttpMethod)
                }
                disabled={pending}
                className="method-select"
              >
                {HTTP_METHODS.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
            </div>
            <div className="url-field">
              <label
                className="field-label"
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
                className="url-input"
                spellCheck={false}
              />
            </div>
            <Button
              type="submit"
              disabled={pending}
              className="send-button"
            >
              {pending ? <LoaderCircle className="animate-spin" /> : <Send />}
              Send request
              <CornerDownLeft className="send-enter" />
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
          {error && (
            <p
              role="alert"
              className="request-error"
            >
              {error}
            </p>
          )}
          <div className="editor-grid">
            <section
              className="request-details"
              aria-label="Request options"
            >
              <Tabs
                defaultValue="headers"
                className="editor-tabs"
              >
                <TabsList
                  variant="line"
                  className="editor-tablist"
                >
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
                  <div
                    className="headers-table-labels"
                    aria-hidden="true"
                  >
                    <span>Header name</span>
                    <span>Value</span>
                    <span />
                  </div>
                  {headers.map((header, index) => (
                    <div
                      key={header.id}
                      className="header-row"
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
                        className="header-input font-mono"
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
                        className="header-input font-mono"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove header ${index + 1}`}
                        className="remove-header"
                        disabled={pending}
                        onClick={() =>
                          setHeaders(
                            headers.filter((row) => row.id !== header.id),
                          )
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
                  <p className="headers-help">
                    Pass bearer tokens with the <code>Authorization</code>{" "}
                    header.
                  </p>
                </TabsContent>
                <TabsContent value="body">
                  <label
                    htmlFor="body"
                    className="mb-3 block text-xs text-muted-foreground"
                  >
                    Raw request body. Set the appropriate Content-Type in
                    Headers.
                  </label>
                  <Textarea
                    id="body"
                    value={body}
                    disabled={pending}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder={'{\n  "message": "hello"\n}'}
                    className="body-editor font-mono"
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
                    onChange={(event) =>
                      setTimeoutMs(Number(event.target.value))
                    }
                    className="max-w-60"
                  />
                  <p className="text-xs text-muted-foreground">
                    Between 1 and 60,000 ms, including response download time.
                  </p>
                </TabsContent>
              </Tabs>
              <div className="request-details-foot">
                <ShieldCheck size={14} /> Session cookies stay with GoRequest.
              </div>
            </section>
            <section
              aria-label="Response"
              aria-busy={pending}
              className="response-panel"
            >
              <div className="response-titlebar">
                <h2>Response</h2>
                {!response && (
                  <span className="response-state">
                    {pending ? "Running" : "No response yet"}
                  </span>
                )}
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
                  className="response-tabs editor-tabs"
                >
                  <TabsList
                    variant="line"
                    className="editor-tablist"
                  >
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="body">
                    <pre className="response-code">
                      {response.body
                        ? prettyBody(response.body)
                        : "(empty body)"}
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
                                  <td className="p-3 align-top font-mono">
                                    {key}
                                  </td>
                                  <td className="break-all p-3 font-mono">
                                    {value}
                                  </td>
                                </tr>
                              )),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="response-empty">
                  <div
                    className="empty-response-art"
                    aria-hidden="true"
                  >
                    <span className="empty-bracket">&#123;</span>
                    <span className="empty-art-lines">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="empty-bracket">&#125;</span>
                  </div>
                  <span className="response-empty-icon">
                    {pending ? (
                      <LoaderCircle
                        size={20}
                        className="animate-spin"
                      />
                    ) : (
                      <FileJson size={20} />
                    )}
                  </span>
                  <p
                    role="status"
                    className="empty-response-title"
                  >
                    {pending ? "Waiting for a response…" : "Ready when you are"}
                  </p>
                  <p className="empty-response-description">
                    {pending
                      ? "GoRequest is executing your request."
                      : "Send your request to inspect the response body, headers, status, and timing."}
                  </p>
                  {!pending && (
                    <span className="response-flow">
                      Request <ArrowRight size={13} /> Response
                    </span>
                  )}
                </div>
              )}
            </section>
          </div>
        </form>
        <div className="window-statusbar">
          <span>
            <ShieldCheck size={13} /> Public destinations only
          </span>
          <span>
            5 MiB response limit <span className="statusbar-divider">/</span>{" "}
            Redirects returned as received
          </span>
        </div>
      </div>
      <div className="workspace-tip">
        <span>
          <Code2 size={16} /> Test an endpoint, inspect the details, adjust your
          request.
        </span>
        <a
          href="https://github.com/MarlonBBo/GoRequest#execute-an-http-request"
          target="_blank"
          rel="noreferrer"
        >
          Read the API guide <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
}
