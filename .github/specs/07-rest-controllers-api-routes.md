# Spec: REST Controllers and API Routes

## Overview

Implement the first persistent blog and comment APIs for QuickBlog. Public readers can retrieve published blogs and submit comments for moderation. Authenticated admins can create and manage blogs, review comments, and retrieve dashboard statistics. This follows the completed server setup, data models, authentication, and image-upload pipeline.

This feature is backend-only. The existing admin screens continue to use fixture data until a separate frontend integration change. The existing protected image-upload endpoint remains available and is not reimplemented here.

## Depends on

- The Express server and MongoDB connection in `server/`.
- The existing Blog and Comment Mongoose models in `server/models/`.
- The admin JWT middleware and login/session endpoints.
- The protected ImageKit upload endpoint, which returns the URL used by blog create/update requests.
- The existing QuickBlog frontend data and UI contracts for blog fields, dashboard metrics, and comment moderation.

## Routes

All responses use JSON. Successful responses use `{ "success": true, ... }`; failures use `{ "success": false, "message": "<safe message>" }`. Do not return raw database or provider errors.

### Public routes

- `GET /api/blog/all` — return published blogs only, newest first, as `{ "success": true, "blogs": [...] }`. Drafts must never appear in this result.
- `GET /api/blog/:id` — return a published blog and its approved comments as `{ "success": true, "blog": {...}, "comments": [...] }`. Do not return a draft to a public caller. Return HTTP 400 for an invalid ID and HTTP 404 when the blog is missing or unpublished.
- `POST /api/blog/:id/comments` — accept JSON `{ "name": "...", "content": "..." }` for a published blog. Create the comment with `isApproved: false` and return HTTP 201 with a review-confirmation message. Reject invalid IDs, missing/blank fields, and comments for missing or unpublished blogs.

### Admin blog routes

All routes below require `requireAdmin`.

- `GET /api/admin/blogs` — return all blogs, including drafts, newest first, as `{ "success": true, "blogs": [...] }`.
- `GET /api/admin/stats` — return published-blog, draft, and total-comment counts and the five newest blogs:
  `{ "success": true, "stats": { "publishedBlogs": 0, "draftBlogs": 0, "totalComments": 0 }, "recentBlogs": [...] }`.
- `POST /api/blog` — create a blog from `title`, optional `subtitle`, `author`, `description`, `category`, and `image`; `isPublished` is optional and defaults to `false`. Return HTTP 201 and the created blog.
- `PUT /api/blog/:id` — replace the blog's editable content fields (`title`, optional `subtitle`, `author`, `description`, `category`, and `image`). Preserve its current publication state. Return the updated blog.
- `PATCH /api/blog/:id/publish` — accept `{ "isPublished": true|false }` and explicitly set publication state. Return the updated blog.
- `DELETE /api/blog/:id` — delete the blog and all comments referencing it. Return success only when the blog and its related comments have been removed.

### Admin comment routes

All routes below require `requireAdmin`.

- `GET /api/admin/comments?status=pending|approved` — return comments matching the requested moderation status, newest first, with the related blog ID and title available to the moderation UI. A missing or unsupported status returns HTTP 400.
- `PATCH /api/admin/comments/:id/approval` — accept `{ "isApproved": true|false }` and update the comment's moderation state.
- `DELETE /api/admin/comments/:id` — delete a comment.

### Error behavior

- Return HTTP 400 for malformed IDs, invalid fields, or invalid query parameters.
- Return HTTP 401 for missing, malformed, invalid, or expired admin tokens, using the existing authentication middleware.
- Return HTTP 404 when a requested blog or comment does not exist, or when a public caller requests an unpublished blog.
- Return an appropriate non-success 5xx response for database failures; do not return success-shaped fallback data.
- Preserve the existing `POST /api/blog/upload` route and its established status codes and response shape.

## Database changes

No schema changes. Use the existing Blog and Comment models:

- Blog includes required `title`, `author`, `description`, `category`, and HTTP(S) `image` fields, optional `subtitle`, `isPublished` defaulting to `false`, and timestamps.
- Comment references Blog through `blog`, requires `name` and `content`, defaults `isApproved` to `false`, and includes timestamps.

Do not accept client-supplied `_id`, timestamps, comment approval state during public submission, or other model fields not listed in the endpoint contract.

## Templates

- **Create:** None.
- **Modify:** None. Frontend admin screens remain fixture-driven; connecting them to these APIs is outside this backend feature.

## Files to change

- `server/controllers/adminController.js` to add dashboard statistics.
- `server/routes/adminRoutes.js` to expose protected statistics and comment moderation routes.
- `server/routes/blogRoutes.js` to add public blog/comment and protected blog-management routes without removing the existing upload route.

## Files to create

- `server/controllers/blogController.js`
- `server/controllers/commentController.js`
- `server/tests/blogApi.test.js`
- `server/tests/commentApi.test.js`

## New dependencies

No new dependencies. Reuse Express, Mongoose, JWT middleware, and Node's built-in test runner.

## Rules for implementation

- Keep the implementation under `server/` and use the existing ES-module and controller/router conventions.
- Protect every admin-only route with `requireAdmin`; public listing, detail, and comment-submission routes remain public.
- Validate request bodies, allowed fields, category values, image URLs, and MongoDB IDs server-side. Trim required text and reject empty strings.
- Use the existing Blog model category enum and HTTP(S) image URL validation. Blog creation and update receive the ImageKit URL; they do not upload files.
- Filter public blog queries to `isPublished: true`, and filter public detail comments to `isApproved: true`.
- Public comment submission must always create a pending comment; never trust an approval value from the request.
- Keep publication state changes explicit through the publish endpoint and preserve that state during content updates.
- Ensure blog deletion removes related comments and does not report success if required cleanup fails. Document a MongoDB-compatible consistency approach in the implementation plan.
- Keep static routes such as `/all` and `/upload` from being shadowed by `/:id`; preserve the current upload behavior and authentication.
- Handle async database errors through explicit non-success responses or the established Express error path. Do not expose raw exception messages to clients.
- Do not add AI generation, newsletter persistence, pagination, frontend API wiring, model changes, or new authentication mechanisms in this feature.
- Use focused tests that do not require a live MongoDB or ImageKit account. Follow existing test conventions in `server/tests/`.

## Definition of done

- Public blog listing returns only published blogs and orders them newest first; drafts are excluded.
- Public detail returns a published blog and approved comments only; invalid IDs return HTTP 400, and missing or unpublished blogs return HTTP 404.
- Public comment submission validates the target blog and required text, creates a pending comment, and cannot approve a comment through request data.
- Admin blog listing includes drafts and is inaccessible without a valid admin token.
- Admin create validates required model fields and image URL, defaults omitted `isPublished` to `false`, and returns the persisted blog.
- Admin update changes editable content without changing publication state; the publish endpoint explicitly accepts and persists a boolean state.
- Deleting a blog removes its associated comments and returns a non-success response if the required database operations fail.
- Admin comment listing returns only the selected moderation status and related blog display fields; approval updates and deletion persist and reject invalid or missing comment IDs appropriately.
- Admin statistics report published blogs, drafts, all comments, and up to five most recent blogs.
- All API failure responses use the documented safe JSON error shape and do not expose raw database errors.
- The existing login/session, health, and image-upload endpoints retain their behavior.
- Focused backend tests cover public visibility, validation and not-found cases, authentication, CRUD/publication behavior, comment moderation, statistics, and cascading comment cleanup without external services.
- `npm test` completes successfully from `server/`.
