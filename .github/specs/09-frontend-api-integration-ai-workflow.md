# Spec: Frontend API Integration and AI Content Workflow

## Overview

Connect the existing QuickBlog React frontend to the public and admin APIs already implemented in `server/`. Replace fixture-driven public article data and admin dashboard, blog-list, and comment-moderation data with live API responses; complete the reader comment flow and admin create, edit, publish, and delete workflows. Keep the existing Gemini generation and ImageKit upload features integrated in the blog editor so generated, reviewed content and uploaded media can be submitted through the blog API.

This is the frontend full-stack integration milestone after the server routes and AI endpoint. The current authentication context, AI-generation control, and image-upload control already make API requests, but public pages and most admin screens still rely on fixture data, and the blog editor does not persist posts. The server already defines the required API contracts, so this feature must consume them rather than add duplicate backend behavior.

## Depends on

- The existing React/Vite frontend, public routes, admin screens, and authentication context.
- The server setup, Blog and Comment models, admin authentication, image upload, blog/comment APIs, and Gemini generation endpoint described in `.github/specs/03-express-project-setup.md` through `.github/specs/08-ai-integration.md`.
- The existing `axios`, `marked`, `dompurify`, and `quill` frontend dependencies.
- A running server configured with MongoDB and the provider credentials needed for the flows being exercised.

## Routes

- `/` - Load published blogs from `GET /api/blog/all`; preserve the existing combined search and category filters.
- `/blog/:id` - Load a published blog and its approved comments from `GET /api/blog/:id`; add comment submission through `POST /api/blog/:id/comments`.
- `/admin/dashboard` - Load dashboard metrics and recent blogs from `GET /api/admin/stats`.
- `/admin/listblog` - Load all blogs from `GET /api/admin/blogs`; wire edit, publish/unpublish, and delete actions to the existing protected API endpoints.
- `/admin/addblog` - Create a blog using `POST /api/blog`.
- `/admin/editblog/:id` - Reuse the blog editor to load and update a blog using `GET /api/admin/blogs` or the available admin list data and `PUT /api/blog/:id`. Preserve the existing publication state during content edits.
- `/admin/comments` - Load pending or approved comments from `GET /api/admin/comments?status=pending|approved`; wire approval and deletion to the existing moderation endpoints.

No new backend routes are required. Existing `/admin` login/session and protected nested routes remain unchanged.

## Database changes

No database changes. Use the existing Blog and Comment schemas and the API's published/approved visibility rules.

## Templates

- **Create:** `fronted/src/api.js` for a shared Axios client and frontend API functions.
- **Modify:** `fronted/src/App.jsx` to add the edit route; `fronted/src/context/AuthContext.jsx` to use the shared client and clear authentication consistently on unauthorized responses; `fronted/src/pages/Home.jsx`, `fronted/src/pages/BlogDetail.jsx`, `fronted/src/pages/admin/Dashboard.jsx`, `fronted/src/pages/admin/ListBlog.jsx`, `fronted/src/pages/admin/AddBlog.jsx`, and `fronted/src/pages/admin/Comments.jsx` to load and mutate live API data; `fronted/src/components/admin/BlogTableItem.jsx` and `fronted/src/components/admin/CommentTableItem.jsx` to expose real actions and states; `fronted/src/components/Newsletter.jsx` so its local-only behavior does not imply a real subscription; and `fronted/.env.example` so its local API URL matches the server's default port.

## Files to change

- `fronted/.env.example`
- `fronted/src/App.jsx`
- `fronted/src/context/AuthContext.jsx`
- `fronted/src/pages/Home.jsx`
- `fronted/src/pages/BlogDetail.jsx`
- `fronted/src/pages/admin/Dashboard.jsx`
- `fronted/src/pages/admin/ListBlog.jsx`
- `fronted/src/pages/admin/AddBlog.jsx`
- `fronted/src/pages/admin/Comments.jsx`
- `fronted/src/components/admin/BlogTableItem.jsx`
- `fronted/src/components/admin/CommentTableItem.jsx`
- `fronted/src/components/Newsletter.jsx`

## Files to create

- `fronted/src/api.js`

## New dependencies

No new dependencies. Reuse the existing Axios, Marked, DOMPurify, and Quill packages.

## Rules for implementation

- Use the existing frontend at `fronted/` and backend at `server/`. No `.github/project-instructions.md` exists; follow `.github/copilot-instructions.md` and the established QuickBlog conventions.
- Keep backend routes and response contracts unchanged. Use the documented endpoints: public blog listing/detail/comment submission; protected admin stats/blog listing/blog create/update/publication/delete/comment listing/moderation; protected image upload; protected AI generation.
- Centralize frontend requests through the shared Axios client. Read `VITE_BASE_URL` from the frontend environment, remove trailing slashes when composing URLs, and do not hardcode a production API origin.
- `server/server.js` defaults to port `5000`, while the existing `fronted/.env.example` points to `5000`. Change the example to `http://localhost:5











000`; allow an explicitly configured `VITE_BASE_URL` to override it.
- Reuse the existing auth token and bearer-header behavior. A protected request receiving HTTP 401 must clear the stored token and shared authorization header, return the admin to the signed-out state, and avoid presenting the failed operation as successful.
- Keep API field names aligned with the backend (`subtitle`, `isPublished`, and the documented comment fields). Normalize `subtitle` versus the fixture/UI's existing `subTitle` spelling at the API boundary or update consuming components consistently; do not silently drop subtitles.
- Public listing must render only API-provided published blogs. Blog detail must render only API-provided approved comments, submit only `{ name, content }`, and tell readers that a submitted comment awaits review.
- In the admin editor, support create and edit modes using the existing Blog fields. Require the server-required title, author, description, category, and uploaded image URL; send `subtitle` and the selected publication state using the existing API contract. Do not mark a blog as saved until the API confirms success.
- Keep ImageKit upload and Gemini generation on the existing protected endpoints. Generated Markdown must be converted with Marked and sanitized with DOMPurify before entering Quill; failed generation must preserve existing editor contents. Persist only after the admin explicitly submits the reviewed editor form.
- Sanitize stored article HTML with the existing DOMPurify dependency before rendering it in the public detail page. Do not inject API or AI content as unsanitized HTML.
- Keep pending and approved comment counts and dashboard values sourced from API responses. On successful mutation, refresh or update affected data only after the server confirms the operation; show an explicit error on failure.
- The newsletter has no backend endpoint in the existing API. Keep it explicitly non-persistent and do not claim that a real subscription was recorded.
- Provide loading, empty, not-found, and recoverable error states for API-backed pages and operations. Keep forms, tables, feedback, and navigation keyboard accessible and responsive.
- Do not add database changes, backend routes, new authentication mechanisms, or a newsletter provider in this feature.
- Preserve the existing React Router structure, fixture assets where still used, theme variables, and public/admin visual conventions.
- No frontend test runner is currently configured. Do not add testing dependencies solely for this feature; use existing frontend lint/build scripts, backend API tests, and documented end-to-end checks.

## Definition of done

- With the server and frontend running at their configured URLs, the homepage displays published API blogs; search and category filters work together, and API failures and empty results have distinct visible states.
- Opening a valid published `/blog/:id` displays its API content and only approved comments; invalid, missing, or unpublished articles show a clear not-found state.
- A reader can submit a non-empty name and comment to a published article, receives the review-pending confirmation after HTTP 201, and does not see the new comment as public until it is approved.
- An authenticated admin dashboard displays the server's published-blog, draft-blog, total-comment counts, and recent blogs; loading and server errors are visible rather than replaced with fixture counts.
- The admin blog list displays drafts and published posts returned by the protected API. Create, edit, publish/unpublish, and delete actions update persisted data only after successful responses; a refresh shows the same server state.
- The create and edit forms upload a valid thumbnail through the existing protected upload endpoint, retain the returned ImageKit URL, and submit the documented Blog fields to the existing create or update endpoint.
- An authenticated admin can generate Markdown through the existing protected AI endpoint, edit the sanitized content in Quill, and save it only after explicit submission. Invalid prompts, provider failures, and blog-save failures are announced without losing existing editor content or claiming a save.
- The comments screen loads the selected pending/approved status from the API; approval and deletion persist, update the displayed rows/counts, and report errors when the server rejects an action.
- Protected API requests without a valid token are rejected; an expired/invalid-session response clears local authentication and returns the UI to the login state.
- The frontend and backend local defaults use port `5000`, a configured `VITE_BASE_URL` works without doubled slashes, and no server secrets appear in the frontend bundle.
- The newsletter does not report a real subscription because no subscription API exists.
- API-backed screens remain usable at mobile, tablet, and desktop widths with keyboard-accessible controls and no horizontal overflow beyond intentionally scrollable tables.
- `npm test` completes successfully from `server/`; `npm run lint` and `npm run build` complete successfully from `fronted/`.
- Existing login/session behavior, admin route protection, image upload, AI generation, and public filtering/detail behavior continue to work with live API data.
