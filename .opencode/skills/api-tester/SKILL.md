---
name: api-tester
description: Use when asked to test a running API in the project. Analyze the codebase to discover endpoints, find the running server URL/port, probe every endpoint with curl across all plausible HTTP methods and valid + invalid inputs, and write a markdown report of successes and errors.
---

# API Tester

Test a running API in this project with `curl`, covering every possible request shape, and produce a markdown report that documents both the successes (aciertos) and errors (errores).

## Workflow

### 1. Analyze the project

- List the project root: `ls -la`, read `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` / `composer.json` (whichever exists) to identify the framework (Express, Fastify, Django, Flask, FastAPI, Spring, Gin, Laravel, etc.).
- Find the route definitions. Look for:
  - `/api`, `routes/`, `controllers/`, `views/`, `handlers/`, `src/server`, `app.py`, `main.py`, `index.js`, `server.js`.
  - Search for decorators or annotations (`@app.get`, `@router.post`, `@app.route`), route registrations (`app.get(...)`, `router.get(...)`, `path(`), and prefix definitions (e.g. `prefix="/api/v1"`).
  - Note the HTTP methods and path parameters for each endpoint.
- Determine the port and base URL. Check config files, `.env`, `README.md`, or the server startup line for the `PORT`/`HOST` (defaults: 3000, 8000, 5000, 8080, 8001).

### 2. Confirm the API is running

- Determine the base URL from the project. Common defaults: `http://127.0.0.1:3000`, `:8000`, `:5000`, `:8080`. Prefer the port found in config/.env/README.
- Probe it:
  ```bash
  curl -i -s -m 10 http://127.0.0.1:8000/api/v1/
  ```
- If nothing responds, detect the running process and port:
  ```bash
  ps aux | grep -iE "node|uvicorn|gunicorn|python|java|go run|php"
  curl -s -m 5 -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
  ```
- Only proceed with testing once a port actually accepts connections. If no API is reachable, report that and stop.

### 3. Build the test matrix

For **every** discovered endpoint build the full grid of cases:

| Case | Method | Input | Expected |
|------|--------|-------|----------|
| Happy path | as documented | valid body/params | 2xx |
| Method error | other methods (GET/POST/PUT/PATCH/DELETE/OPTIONS) | — | 4xx/5xx |
| Bad path | wrong path, e.g. `/api/v1/user` on `users` | — | 404 |
| Bad body | malformed/incomplete JSON | wrong fields | 4xx validation error |
| Bad types | wrong data types in body/query | string for int, etc. | 4xx |
| Empty body | no body where JSON required | `{}` or empty | 4xx/2xx depending on optionality |
| Missing params | no required path/query params | — | 4xx |
| Extra params/fields | unexpected fields | — | documented or 400 |
| Auth | missing/invalid credentials or token | — | 401/403 |
| Path parameters | each concrete value (e.g. `/users/1`) | valid id | 200 |

Also cover any documented error responses from the source code (404 not found, 422 validation, 500, etc.).

### 4. Run the curl tests

- Use `curl -s -i -m 10` (show headers + status + body) so you can capture the exact HTTP status code.
- Test HTTP methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`.
- Send JSON with `curl -X METHOD -H 'Content-Type: application/json' -d '...'`.
- Use `write-out` to capture status cleanly:
  ```bash
  curl -s -m 10 -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/api/v1/users
  ```
- Record for every request: method, full URL, status code, and a trimmed body (max ~300 chars).

### 5. Detect other API surfaces

- If the project includes an OpenAPI/Swagger spec (`openapi.json`, `swagger-ui`), test routes declared there too.
- If there is a websocket or SSE endpoint mention, note that curl cannot test it and mark it as "not tested / not aplicable with curl".

### 6. Write the report

Create `api-tests-report.md` (or `API_REPORT.md` in the project root) with this structure:

```markdown
# API Test Report

Fecha: <today>
Base URL: <url>
API: <framework + how it was started>

## Resumen

| Total tests | Éxitos (2xx) | Errores esperados | Errores inesperados |
|---|---|---|---|
| N | X | Y | Z |

## Endpoints probados

- <method> <path> — <description>

## Tests

### 1. <Method> <endpoint> — <case name>
- **URL:** ...
- **Esperado:** <status>
- **Resultado:** <status> ✅ / ❌
- **Respuesta:** `...`

## Errores inesperados (bugs encontrados)

- <method> <path> — se esperaba <status> pero devolvió <status> ...

## Notas

- <websocket/SSE not testable with curl, auth strategy, etc.>
```

- Use ✅ for tests matching the expected status, ❌ for unexpected failures, and separately list genuine bugs (where the API returns an unexpected status or behavior on valid input).
- If the user only wants errors reported, keep the full table but highlight the failures section.

## Rules

- Do not modify, start, or stop the API unless asked — only test it with curl.
- Never guess: derive the base URL, port, and endpoints from project files, and confirm the server is reachable before batching tests.
- Write the report file, do not only print it. Prefer the project root unless the user names a different path.