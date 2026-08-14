# AGENTS.md

## Cursor Cloud specific instructions

Shanti (`psicostatus`) is a single product: a Vite + React 19 SPA plus one Netlify
Function backend (`netlify/functions/api.ts`, served under `/api/*`). Auth is
Firebase Authentication (client-side); data lives in Cloud Firestore and is
accessed only server-side via the Firebase Admin SDK. See `README.md` for the
canonical setup/run steps and route list.

### Services and how to run them

- Frontend only: `npm run dev` (Vite, http://localhost:5173). API calls proxy to
  `http://localhost:8888` (see `vite.config.ts`), so data calls fail unless the
  function is also running.
- Full stack (frontend + function): `netlify dev` (Vite on 5173, functions on
  8888, `/api` reverse-proxied). This is the real end-to-end dev mode.
- Lint/type check: there is **no ESLint config**; `npm run typecheck`
  (`tsc -b --noEmit`) is the effective lint/type gate.
- Build: `npm run build`. There are **no automated tests** in this repo.

### Non-obvious gotchas

- `netlify dev` needs the Netlify CLI, which is **not** a project dependency. Run
  it via `npx netlify-cli dev` (or install globally). Note the README's
  `npx netlify dev` can resolve the wrong `netlify` npm package with
  "could not determine executable to run" — always use the `netlify-cli` package.
- Environment variables come from `.env` (copy `.env.example`). `netlify dev`
  auto-injects `.env` into the function runtime.
  - Client (public, build-time): `VITE_FIREBASE_API_KEY`,
    `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
  - Function only: `FIREBASE_SERVICE_ACCOUNT` (full JSON), `ADMIN_EMAIL`.
- **Browser login requires a real Firebase project.** The client
  (`src/lib/firebase/client.ts`) never calls `connectAuthEmulator`, so the browser
  auth flow always talks to real Google endpoints. To exercise login/registration
  and the authenticated UI you need real `VITE_FIREBASE_*` values plus a matching
  `FIREBASE_SERVICE_ACCOUNT` and `ADMIN_EMAIL`.

### Testing the backend without real Firebase creds (Firebase emulators)

The Admin SDK honors `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST`, so
the **function/API can be fully exercised against the Firebase emulators** even
though the browser cannot. Recipe used successfully here:

1. `firebase.json` has no `emulators`/`auth` block, so start emulators with a
   throwaway config that enables auth, e.g.
   `firebase emulators:start --only firestore,auth --project demo-shanti --config <tmp.json>`
   where the config sets `emulators.auth` (9099) and `emulators.firestore` (8080).
2. In `.env` set `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`,
   `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`, `ADMIN_EMAIL=<your test admin>`,
   dummy `VITE_FIREBASE_*`, and a `FIREBASE_SERVICE_ACCOUNT` JSON whose
   `private_key` is any syntactically valid PEM (a locally generated RSA key
   works; the emulator does not verify it). `project_id` must be `demo-shanti`.
3. Mint an ID token from the Auth emulator, then call the API:
   `POST http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=any`
   returns an `idToken`; send it as `Authorization: Bearer <idToken>` to `/api/...`
   (e.g. `POST /api/me/bootstrap`, then `POST /api/workspaces`).

Requires `firebase-tools` and a JRE (Java 21 is present on the image).
