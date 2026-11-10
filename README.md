# GoRequest-Web

An open-source web interface for sending HTTP requests, inspecting responses, and learning how APIs work.

GoRequest-Web is the frontend for [GoRequest API](https://github.com/MarlonBBo/GoRequest). It brings request editing and response inspection into a focused workspace, while the Go backend handles authentication and HTTP execution.

[Report a bug](https://github.com/GoRequest/GoRequest-Web/issues) · [Suggest a feature](https://github.com/GoRequest/GoRequest-Web/issues) · [Contribute](#contributing) · [MIT license](./LICENSE)

## About the project

GoRequest is built around a simple idea: API testing should be easy to understand and easy to explore. The project is also a place to learn about HTTP, networking, Go, and modern frontend development through practical contributions.

The frontend is in early development. You can run it locally, explore the code, and help shape what comes next. Bug reports, documentation improvements, accessibility fixes, and feature proposals are welcome.

## Features

- Use the workspace as a guest, or sign in with GitHub and sign out with cookie-based sessions.
- Send GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS requests.
- Add custom headers, destination bearer tokens, and raw request bodies.
- Configure request timeouts from 1 to 60,000 milliseconds.
- Inspect response status, duration, body size, headers, and body.
- View formatted JSON responses and repeated response header values.
- Cancel waiting for a response in the browser.

Requests and responses currently live in page memory and clear on refresh. Saved collections, persistent request history, and lossless binary downloads are not implemented. Cancellation stops the browser from waiting; the backend may continue executing the request.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js App Router and React |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui and Radix UI |
| Icons | Lucide |
| Tests | Vitest |
| Backend | GoRequest API, maintained in a separate repository |

## Getting started

### Prerequisites

- Node.js 22.13 or newer; the included [.nvmrc](./.nvmrc) selects Node 24.
- npm and Git.
- A running [GoRequest API](https://github.com/MarlonBBo/GoRequest) instance. Check its README for Go requirements and backend setup.

### 1. Start the frontend

```sh
git clone https://github.com/GoRequest/GoRequest-Web.git
cd GoRequest-Web
npm ci
```

Copy the example environment file:

```sh
# Bash
cp .env.example .env.local
```

```powershell
# PowerShell
Copy-Item .env.example .env.local
```

The default API address is:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Start the development server:

```sh
npm run dev
```

Open http://localhost:3000. Restart the frontend after changing its environment variables.

### 2. Configure and start the backend

In your GoRequest API checkout, configure its `.env` (the backend loads it automatically):

```dotenv
GITHUB_CLIENT_ID=your-github-oauth-app-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-app-client-secret
GITHUB_REDIRECT_URL=http://localhost:8080/auth/github/callback
AUTH_INSECURE_COOKIES=true
FRONTEND_ORIGIN=http://localhost:3000
```

In your GitHub OAuth App settings, use `http://localhost:3000` as the homepage URL
and `http://localhost:8080/auth/github/callback` as the authorization callback URL.
Keep the client secret in the backend environment only. The frontend needs only
`NEXT_PUBLIC_API_URL`; it does not need a GitHub client ID or secret.

Then start the backend in a separate terminal:

```powershell
# PowerShell
$env:AUTH_INSECURE_COOKIES = "true"
$env:FRONTEND_ORIGIN = "http://localhost:3000"
go run ./cmd/server
```

```sh
# Bash
AUTH_INSECURE_COOKIES=true FRONTEND_ORIGIN=http://localhost:3000 go run ./cmd/server
```

Set these variables **before starting the backend**. `FRONTEND_ORIGIN` must match the frontend's exact origin, including its port, for credentialed CORS and browser request protection. `AUTH_INSECURE_COOKIES=true` enables session cookies over plain HTTP for local development only.

Use `localhost` for both servers. Mixing it with `127.0.0.1` can prevent session cookies from working. If Next.js selects another port, update `FRONTEND_ORIGIN` and restart the backend.

### 3. Send your first request

1. Open the workspace as a guest, or choose **Sign in with GitHub** and authorize the app.
2. Keep the default GET request to `https://httpbin.org/get`, or enter another public HTTP/HTTPS URL.
3. Select **Send request**.
4. Inspect the response body, headers, status, timing, and size.

The backend accepts public destinations only; localhost and private network targets are blocked. Destination 4xx and 5xx responses appear in the response inspector as completed requests.

### Connection troubleshooting

| Symptom | What to check |
| --- | --- |
| Frontend reports that the API is unavailable | Confirm that `http://localhost:8080/health` responds and `NEXT_PUBLIC_API_URL` points to the API. |
| API works directly, but the browser cannot connect | Set `FRONTEND_ORIGIN` to the exact frontend origin and restart the backend. A running API still needs CORS configured. |
| Login succeeds, but the session does not persist | Use `localhost` consistently and enable `AUTH_INSECURE_COOKIES=true` for local HTTP development. |
| GitHub sign-in returns 404 | Configure all three `GITHUB_*` settings on the backend and restart it; sign-in routes are disabled when all are absent. |
| GitHub reports a callback mismatch | Match the OAuth App callback URL and backend `GITHUB_REDIRECT_URL` exactly. |
| Sign-in finishes on a JSON page | Set backend `FRONTEND_ORIGIN` to the frontend origin so the callback redirects back to the workspace. |
| GitHub sign-in returns 429 | Wait before retrying; the backend rate-limits authentication attempts. |

### GitHub sign-in flow

The sign-in link navigates the browser to `${NEXT_PUBLIC_API_URL}/auth/github`.
The Go backend handles GitHub authorization, state, PKCE, and the callback, sets
an HttpOnly session cookie, then redirects to `FRONTEND_ORIGIN/`. The frontend
checks `/auth/me` with cookies after loading; a 401 opens the guest workspace.
Signing out revokes the session through `POST /auth/logout` and keeps the
workspace available as a guest. Request execution is available in both states.

The backend returns rejected OAuth callbacks as JSON errors on the API page.
Return to the frontend and retry sign-in if authorization fails or expires.
Email/password signup and login are no longer supported. With all GitHub
settings absent, the backend still supports guest requests.

## Development

### Project structure

| Path | Purpose |
| --- | --- |
| [src/app](./src/app) | App Router pages, layout, metadata, and global styles |
| [src/components](./src/components) | Authentication and request workspace |
| [src/components/ui](./src/components/ui) | Editable shadcn/ui components |
| [src/lib/api](./src/lib/api) | API types, credentialed fetch client, and client tests |
| [components.json](./components.json) | shadcn CLI configuration |

### Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Run ESLint |
| `npm test` | Run API client tests |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |

Client tests mock fetch to check the API contract. GitHub authorization, CORS, session cookies, and request execution also need verification against a live backend.

Add UI components using the existing shadcn configuration:

```sh
npx shadcn@latest add <component>
```

## Contributing

Contributions of all sizes are welcome. You can help by reproducing a bug, improving setup instructions, making the interface more accessible, adding meaningful tests, or proposing a feature.

1. Check [existing issues](https://github.com/GoRequest/GoRequest-Web/issues) for related work. For a substantial change, open an issue to discuss the approach first.
2. Fork the repository and create a branch for your change.
3. Make a focused change and update documentation or tests when relevant.
4. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
5. Open a pull request explaining the problem, your solution, and how you verified it. Include screenshots for visual changes.

When reporting a bug, include reproduction steps, expected and actual behavior, browser and Node.js versions, and relevant errors. Remove passwords, tokens, cookies, and other private data from logs and screenshots.

Frontend issues belong in [this repository](https://github.com/GoRequest/GoRequest-Web/issues). Backend authentication and HTTP execution issues belong in [GoRequest API](https://github.com/MarlonBBo/GoRequest/issues).

## Deployment

Set `NEXT_PUBLIC_API_URL` to the public HTTPS API origin **before building**. Next.js embeds public environment variables in the browser bundle.

```sh
npm run build
npm start
```

On the backend, set `FRONTEND_ORIGIN` to the exact HTTPS frontend origin and leave `AUTH_INSECURE_COOKIES` unset. Configure the backend GitHub credentials and set `GITHUB_REDIRECT_URL` to the public HTTPS API callback URL; use the same callback URL in your GitHub OAuth App. The frontend and API must be on the same site, such as sibling subdomains, for SameSite=Lax session cookies to accompany API fetches.

All authentication and protected API calls include cookies through `credentials: "include"`. Session tokens are never stored in localStorage. Destination bearer tokens are supplied separately through the request editor's Authorization header.

The backend enforces a 1 MiB request limit and a 5 MiB response limit. Response bodies render as text, including HTML. See the backend documentation for destination validation, persistence, and deployment details.

## License

GoRequest-Web is open source under the [MIT License](./LICENSE). You are welcome to use, modify, and redistribute it under those terms.
