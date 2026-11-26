# Spec: Authentication System

## Overview

Implement single-admin authentication for Quick Blog. The admin signs in through the existing `/admin` login page using credentials configured only on the server. The backend issues a bounded-lifetime JWT, verifies it on protected admin API requests, and exposes a protected session endpoint so the frontend can restore or clear an authenticated session after a page refresh.

Protect the existing admin dashboard, blog editor, blog list, and comment moderation routes from unauthenticated navigation. This is the authentication foundation for later admin API work; it does not add blog or comment management endpoints.

## Depends on

- The existing React/Vite admin interface and nested routes from the Admin Dashboard UI feature.
- The Express server and MongoDB connection from the Express Project Setup feature.
- The existing `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` placeholders in `server/.env.example`.
- The existing `jsonwebtoken` dependency in `server/package.json`.
- Data Modeling is the preceding roadmap step, but authentication does not depend on or modify its Blog and Comment schemas.

## Routes

- `POST /api/admin/login` — public login endpoint. Accepts JSON `{ "email": "admin@example.com", "password": "..." }`. Return `{ "success": true, "token": "..." }` on success. Return a generic authentication error with HTTP 401 for incorrect credentials and HTTP 400 for missing or invalid fields.
- `GET /api/admin/session` — protected session-validation endpoint. Accepts `Authorization: Bearer <token>` and returns `{ "success": true, "authenticated": true }` for a valid token. Return HTTP 401 for missing, malformed, invalid, or expired tokens.
- Existing frontend routes `/admin`, `/admin/dashboard`, `/admin/addblog`, `/admin/listblog`, and `/admin/comments` remain in place. `/admin` shows the login page when signed out and redirects an authenticated admin to `/admin/dashboard`; the other routes require an authenticated session and redirect signed-out visitors to `/admin`.
- Do not add business API endpoints for blogs, comments, or dashboard statistics in this feature. Apply the authentication middleware to future admin-only API routes when those endpoints are implemented.

## Database changes

No database changes. Use the existing server-side environment credentials for the single admin; do not create an Admin or User model or store credentials in MongoDB.

## Templates

- **Create:** `fronted/src/context/AuthContext.jsx` for authentication state and login/logout actions; `fronted/src/context/authContext.js` for the shared context and hook; `fronted/src/components/admin/RequireAuth.jsx` for protected admin navigation; `fronted/.env.example` for the public API base URL.
- **Modify:** `fronted/src/App.jsx`, `fronted/src/main.jsx`, `fronted/src/components/admin/Login.jsx`, `fronted/src/pages/admin/Layout.jsx`, and `fronted/src/components/admin/Sidebar.jsx` to wire login, session restoration, route protection, and logout.

## Files to change

- `fronted/package.json`
- `fronted/package-lock.json`
- `fronted/src/App.jsx`
- `fronted/src/main.jsx`
- `fronted/src/components/admin/Login.jsx`
- `fronted/src/pages/admin/Layout.jsx`
- `fronted/src/components/admin/Sidebar.jsx`
- `server/package.json`
- `server/server.js`

## Files to create

- `fronted/.env.example`
- `fronted/src/context/AuthContext.jsx`
- `fronted/src/context/authContext.js`
- `fronted/src/components/admin/RequireAuth.jsx`
- `server/controllers/adminController.js`
- `server/middleware/auth.js`
- `server/routes/adminRoutes.js`
- `server/tests/adminAuth.test.js`

## New dependencies

- `axios` in `fronted/` for API requests and the shared authorization header. The backend already depends on `jsonwebtoken`; no backend runtime dependency is needed.

## Rules for implementation

- Use the existing Quick Blog React/Vite frontend in `fronted/` and the ES-module Express server in `server/`.
- Validate login credentials only on the backend using `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Never expose those values or `JWT_SECRET` through frontend code, logs, or `VITE_` variables.
- Treat missing authentication environment variables as a server configuration error, not as incorrect user credentials; report the configuration failure explicitly without returning secret values.
- Sign JWTs with an explicit supported algorithm, a minimal admin subject claim, and a bounded 24-hour expiry. Verify the token and expiry on every protected API request.
- Accept only the `Bearer` authorization scheme. Do not trust decoded-but-unverified token contents.
- Use a generic response for incorrect email/password so the endpoint does not reveal which credential was wrong.
- Follow the project-documented bearer-token approach: store only the JWT in `localStorage`, attach it to Axios requests, and clear both storage and the shared authorization header on logout or when session validation fails. Never store the password.
- Provide a visible loading state while restoring the session so protected content is not briefly rendered before authentication is checked.
- Protect APIs on the server as well as frontend routes. Client-side route guards are navigation UX, not authorization.
- Keep login and logout usable with keyboard and assistive technology; preserve responsive styling and visible focus states.
- Do not add registration, password reset, multiple admin accounts, roles, database credential storage, refresh tokens, or cookie-based authentication in this milestone.
- Preserve public reader routes and `/api/health`. Do not change Blog or Comment schemas.
- Keep `VITE_BASE_URL` public and configurable through `fronted/.env`; do not commit a real `.env` file.
- Avoid unsafe HTML rendering in the admin UI; JWT storage in `localStorage` increases the impact of XSS, so do not introduce unsanitized HTML or AI content rendering.
- Use Node's built-in test runner for focused backend authentication tests; do not add a test framework dependency solely for this feature.

## Definition of done

- `POST /api/admin/login` accepts valid configured credentials and returns a JWT with a 24-hour expiry; invalid credentials return HTTP 401 with a generic message, and invalid or missing fields return HTTP 400.
- Missing required auth environment settings produce an explicit server-side configuration error and are not reported as a normal invalid-login response.
- `GET /api/admin/session` succeeds with a valid bearer token and rejects absent, malformed, tampered, and expired tokens with HTTP 401.
- Unauthenticated visits to `/admin/dashboard`, `/admin/addblog`, `/admin/listblog`, and `/admin/comments` redirect to `/admin`; authenticated visits and refreshes on these routes render the requested page.
- Successful login stores the token, attaches it to authenticated API requests, and navigates to the dashboard. The login page does not offer a bypass link to the dashboard.
- Logout removes the token and shared Axios authorization header, returns the admin to `/admin`, and subsequent protected API requests are unauthorized.
- Session restoration validates the stored token before protected content is rendered; invalid or expired sessions are cleared and redirected to login.
- Credentials and signing secrets do not appear in frontend source or the production frontend bundle.
- Focused backend tests pass using the built-in Node test runner without requiring a live MongoDB connection.
- `npm run lint` and `npm run build` complete successfully from `fronted/`.
- Existing public home, blog-detail, and health-check behavior remains unchanged.
