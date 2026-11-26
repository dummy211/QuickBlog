# Spec: Express Project Setup

## Overview

Create the QuickBlog backend foundation in a new `server/` directory. This is the first server-side milestone: configure an ES-module Express application, environment loading, CORS, JSON request parsing, MongoDB connection, and a health endpoint. The repository currently contains only the React/Vite frontend; no server package, database connection, root ignore rules, or backend routes exist. This setup enables subsequent data modeling, authentication, and API work without implementing those features prematurely.

## Depends on

- Completed public landing page and admin dashboard UI in `fronted/`.
- Node.js and npm available in the development environment.
- A MongoDB connection string supplied locally through `server/.env`; no credentials are required in source control.

## Routes

- `GET /api/health` - Return a small JSON status response when the Express service is available. Do not expose configuration values, secrets, or database credentials.

No business API routes are included in this setup step.

## Database changes

No database schema changes. Establish a Mongoose connection to MongoDB using `MONGODB_URI`; Blog and Comment schemas are deferred to a later feature.

## Templates

- **Create:** `server/server.js` for the Express app and listener; `server/configs/db.js` for MongoDB connection; `server/routes/healthRoutes.js` for the health endpoint; `server/package.json` and generated `server/package-lock.json`; `server/.env.example` with placeholder values.
- **Modify:** Create a root `.gitignore` to exclude server environment secrets and dependency/build artifacts. Do not modify frontend behavior or routes.

## Files to change

- No existing application files need modification.

## Files to create

- `.gitignore`
- `server/package.json`
- `server/package-lock.json`
- `server/server.js`
- `server/configs/db.js`
- `server/routes/healthRoutes.js`
- `server/.env.example`

## New dependencies

- Runtime: `express`, `mongoose`, `cors`, `dotenv`, `jsonwebtoken`, `multer`, `@google/genai`, and `imagekit`, following the existing QuickBlog backend setup sequence. JWT, upload, Gemini, and ImageKit functionality itself remains out of scope for this step.
- Development: `nodemon`.

## Rules for implementation

- Keep all backend files under `server/`; use `"type": "module"` and the existing ES-module convention.
- Configure `npm run server` to start `nodemon server.js` for development and `npm start` to run the production entry point.
- Load environment variables on the server only. Provide `server/.env.example` with placeholders for `PORT`, `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, ImageKit keys/endpoint, `GEMINI_API_KEY`, and `FRONTEND_ORIGIN`; never create or commit a real `.env`.
- Add root ignore rules for `.env` files, `node_modules`, logs, and build output. Preserve the existing `fronted/.gitignore`.
- Configure CORS for the configured frontend origin rather than allowing every origin in production. Support the local frontend origin during development.
- Parse JSON request bodies and mount health at `/api/health`; do not add blog, comment, or authentication endpoints in this feature.
- Connect to MongoDB through `configs/db.js` using Mongoose. Fail explicitly on missing `MONGODB_URI` or connection errors; do not silently start in a success state when the database connection fails.
- Use an environment-provided port with `3000` as the local default, and surface startup errors clearly.
- Do not add models, controllers, authorization middleware, upload handling, provider initialization, or database schemas in this step.
- No `.github/project-instructions.md` exists in the repository. Follow `.github/copilot-instructions.md` and the established QuickBlog conventions.

## Definition of done

- Running `npm run server` from `server/` starts the Express service on the configured port, defaulting to `3000`, when valid required environment settings are present.
- `GET /api/health` returns a JSON success response without exposing secrets.
- The server connects to MongoDB through the shared connection module before reporting successful readiness.
- Missing `MONGODB_URI` and failed MongoDB connections produce explicit, actionable startup errors and a non-successful process exit.
- JSON request parsing is enabled and CORS permits the configured frontend origin while not defaulting to unrestricted production access.
- `server/package.json` uses ES modules and includes the documented development and production scripts.
- `.gitignore` prevents real environment files, node modules, logs, and build artifacts from being committed; `server/.env.example` contains placeholders only.
- No blog/comment models, business APIs, or frontend files are added or changed.
