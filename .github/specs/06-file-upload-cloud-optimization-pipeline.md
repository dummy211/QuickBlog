# Spec: File Upload & Cloud Optimization Pipeline

## Overview

Add a protected image-upload pipeline for the admin blog editor. The server validates an uploaded thumbnail, sends it to ImageKit for cloud storage and optimization, and returns the optimized CDN URL for the editor to use. This follows the existing Express, data-modeling, and authentication foundations and replaces the current local-only file selection preview with a real upload flow.

This milestone is limited to uploading and returning the image URL. It does not create or persist blog posts; a later blog-management API can save the returned URL in the existing Blog `image` field.

## Depends on

- The Express server and MongoDB connection in `server/`.
- The existing Blog model, which already stores `image` as a required HTTP(S) URL.
- The admin JWT authentication middleware in `server/middleware/auth.js`.
- The existing Multer and ImageKit backend dependencies.
- The existing admin blog editor at `fronted/src/pages/admin/AddBlog.jsx`.

## Routes

- `POST /api/blog/upload` — protected by `requireAdmin`. Accepts `multipart/form-data` with one required file field named `image`. On success, return HTTP 200 with `{ "success": true, "imageUrl": "<optimized ImageKit URL>" }`.
- Return HTTP 400 for a missing or invalid image, HTTP 401 for a missing or invalid admin token, HTTP 413 for a file exceeding the configured size limit, and HTTP 502 for an ImageKit upload failure. Error responses use `{ "success": false, "message": "<safe user-facing message>" }`.

## Database changes

No database changes. The existing Blog `image` field already stores the final URL. This endpoint returns the URL to the client but does not create or update a Blog document.

## Templates

- **Create:** No new templates.
- **Modify:** `fronted/src/pages/admin/AddBlog.jsx` to upload the selected image, show an upload state and preview, and retain the returned CDN URL for the editor session.

## Files to change

- `server/server.js`
- `fronted/src/pages/admin/AddBlog.jsx`

## Files to create

- `server/configs/imagekit.js`
- `server/middleware/multer.js`
- `server/controllers/imageUploadController.js`
- `server/routes/blogRoutes.js`
- `server/tests/imageUpload.test.js`

## New dependencies

No new dependencies. Multer and ImageKit are already listed in `server/package.json`; Axios is already listed in `fronted/package.json`.

## Rules for implementation

- Use the actual frontend directory `fronted/` and the backend directory `server/`.
- Keep ImageKit credentials on the server. Use the existing `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, and `IMAGEKIT_URL_ENDPOINT` environment variables; never expose or log their values. Missing provider configuration must produce an explicit server-side error and a non-success response.
- Protect the upload endpoint with the existing `requireAdmin` middleware. Frontend route protection alone is not authorization.
- Use in-memory upload handling with an explicit size limit; do not write temporary uploads to disk.
- Validate the upload server-side. Accept JPEG, PNG, or WebP images only, reject missing, oversized, or invalid image content, and do not trust the browser-provided filename or MIME type alone. Use a generated safe filename when uploading.
- Use ImageKit optimization settings for automatic quality, WebP output, and a maximum width of 1280 pixels. Return the URL provided for the optimized image.
- Do not save image bytes or ImageKit credentials in MongoDB. Do not modify the Blog or Comment schemas, implement blog CRUD, or claim that a blog was saved.
- The editor must show pending, success, and failure states accessibly, prevent duplicate submissions while an upload is active, and retain no stale URL when a new upload fails or the selected image is cleared.
- Use the existing Axios setup so the admin bearer token is attached. Do not put private values in `VITE_` variables.
- Keep provider errors explicit in server logs without returning sensitive provider details to the client. Do not silently report upload success when ImageKit fails.
- Use the existing Node.js built-in test runner for focused backend tests; tests must not require a live MongoDB or ImageKit account.
- Scope assumption to confirm in the implementation plan: this is a standalone upload endpoint. Blog creation and persistence of the returned URL remain a later API feature.

## Definition of done

- An authenticated admin can upload one valid JPEG, PNG, or WebP image from the blog editor and receives an optimized ImageKit CDN URL.
- The ImageKit upload uses automatic quality, WebP format, and a maximum width of 1280 pixels.
- The editor displays a preview using the returned CDN URL and exposes accessible uploading, success, and failure feedback.
- The endpoint rejects missing files, multiple files, disallowed formats, invalid image content, and files over the configured 5 MiB limit with the documented status and error shape.
- Requests without a valid admin bearer token are rejected with HTTP 401 and do not invoke ImageKit.
- ImageKit configuration or upload failures return a non-success response, do not persist a blog, and do not expose credentials or raw provider details in the response.
- Focused backend tests cover successful upload, invalid/missing/oversized files, authentication rejection, and ImageKit failure without contacting the real provider or MongoDB.
- The existing blog editor remains responsive and keyboard accessible; upload status and errors are announced to assistive technology.
- `npm test` completes successfully from `server/`; `npm run lint` and `npm run build` complete successfully from `fronted/`.
- Existing admin login/session behavior, public routes, Blog schema, and health endpoint remain unchanged.
