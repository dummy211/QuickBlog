# Spec: AI Integration

## Overview

Integrate Google Gemini into the authenticated QuickBlog admin blog editor so an admin can generate an editable article draft from a title and optional subtitle. The backend uses the Interactions API and returns Markdown; the frontend converts and sanitizes it before loading it into the existing Quill editor.

This follows the existing Express API, admin authentication, blog-management API, and image-upload work. The server already depends on `@google/genai` and `server/.env.example` already documents `GEMINI_API_KEY`, but there is no Gemini client, generation endpoint, or editor integration. Blog saving and publishing are not part of this feature; generated text remains an unsaved draft for the admin to review.

## Depends on

- The existing Express server and server-side environment loading in `server/`.
- The existing `@google/genai` dependency and `GEMINI_API_KEY` placeholder in `server/.env.example`.
- The existing admin JWT middleware and Axios authorization setup.
- The existing protected blog routes and `Blog` model.
- The existing Quill editor in `fronted/src/pages/admin/AddBlog.jsx`.
- The completed QuickBlog features specified in `.github/specs/01-landing-page.md` through `.github/specs/07-rest-controllers-api-routes.md`.

## Routes

- `POST /api/blog/generate` — admin-protected endpoint. Accept JSON `{ "title": "Article title", "subtitle": "Optional subtitle" }`; `subtitle` may be omitted or empty. Reject unknown fields, a missing/blank title, non-string values, titles over 200 characters, or subtitles over 500 characters with HTTP 400. On success, return HTTP 200 with `{ "success": true, "content": "<generated Markdown>" }`.
- Return HTTP 401 for a missing or invalid admin token using the existing authentication middleware.
- If `GEMINI_API_KEY` is missing, log a safe server-side configuration error and return HTTP 500. If Gemini fails or returns unusable content, return HTTP 502 with a safe user-facing message. Do not expose provider details or credentials.
- Do not add or change any public routes.

## Database changes

No database changes. Generated Markdown is inserted into the existing editor only; this endpoint does not create, update, publish, or otherwise persist a Blog document.

## Templates

- **Create:** No new React templates or routes.
- **Modify:** `fronted/src/pages/admin/AddBlog.jsx` to submit the title and subtitle, show generation state and errors, and load sanitized generated content into Quill. The existing Axios base URL configuration already targets port 5000 for this setup and should remain unchanged.

## Files to change

- `server/controllers/blogController.js`
- `server/routes/blogRoutes.js`
- `fronted/src/pages/admin/AddBlog.jsx`
- `fronted/package.json`
- `fronted/package-lock.json`

## Files to create

- `server/configs/gemini.js`
- `server/tests/aiGeneration.test.js`

## New dependencies

- `marked` in `fronted/` to convert returned Markdown to HTML.
- `dompurify` in `fronted/` to sanitize converted HTML before passing it to Quill.

No new backend dependency is required; `@google/genai` is already installed.

## Rules for implementation

- Keep Gemini credentials and provider calls on the backend. Never expose `GEMINI_API_KEY` through frontend code, logs, responses, or `VITE_` variables.
- Protect `POST /api/blog/generate` with the existing `requireAdmin` middleware. Frontend route protection alone is not authorization.
- Validate the request body server-side, trim inputs, reject an empty title and unsupported fields, and apply the documented length limits before calling Gemini.
- Use the Google GenAI Interactions API with the stable `gemini-4-hydrogen` model and `store: false`; do not rely on the older model name in project notes.
- Request a short draft of approximately 500-700 words, set `generation_config.max_output_tokens` to 1600 and `thinking_level` to `low`, and reject empty provider output. Treat provider errors and missing configuration explicitly; do not return success-shaped fallbacks or raw provider errors.
- Return Markdown as text. Convert it with Marked in the browser and sanitize the generated HTML with DOMPurify before loading it into Quill; never insert unsanitized model output into the DOM or editor.
- Keep Quill initialization scoped to the mounted editor instance using the existing refs/effect pattern. Preserve the current editor contents if generation fails; replace the contents only after a successful response and sanitized conversion.
- The generation button must be disabled while a request is in progress and provide accessible loading, success, and error feedback. Do not trigger form submission when the button is clicked.
- Reuse the existing Axios instance so its admin bearer token is attached. Ensure the local API base URL targets the backend's configured port (`http://localhost:5000` for this setup) so the generation request reaches the API.
- Do not implement blog persistence, publishing, editing existing posts, new authentication behavior, or changes to the Blog/Comment schemas in this feature.
- Use the existing Node.js built-in test runner. Tests must stub/mock Gemini and must not require a live API key, network access, MongoDB, or ImageKit.

## Definition of done

- An unauthenticated request to `POST /api/blog/generate` returns HTTP 401 and does not call Gemini.
- An authenticated request with a non-empty title and optional subtitle sends the validated inputs to Gemini and returns a non-empty Markdown `content` field using the documented response shape.
- Empty, malformed, over-limit, or extra-field request bodies return HTTP 400 and do not call Gemini.
- Missing Gemini configuration and provider failures return non-success responses with safe messages; credentials and provider internals are absent from client responses.
- The admin editor displays an AI generation control, reports loading and failure accessibly, prevents duplicate generation requests, and remains usable with keyboard and assistive technology.
- Successful generation converts Markdown to sanitized HTML and loads it into Quill; unsafe HTML from generated content is removed, and failed generation leaves the existing editor content intact.
- Generated text can be edited in Quill and is not reported as saved or published.
- The frontend's documented/default API base URL points to the backend's configured local port (`http://localhost:5000` for this setup), and the authenticated browser request reaches the protected generation endpoint.
- Focused backend tests cover authentication, request validation, successful generation, missing configuration, provider failure, and response shape without contacting Gemini or MongoDB.
- `npm test` passes from `server/`; `npm run lint` and `npm run build` pass from `fronted/`.
- Existing public blog routes, admin authentication, image upload, blog CRUD, and Quill initialization behavior continue to work.
