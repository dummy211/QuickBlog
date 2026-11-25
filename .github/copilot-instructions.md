# Quick Blog — Project Context

## Project overview
Quick Blog is a full-stack AI-powered blogging application built with the MERN stack, Google Gemini, ImageKit, and Tailwind CSS. Readers can discover and read posts, search/filter content, and submit comments. Admins can authenticate, manage posts and comments, and generate article drafts with AI.

## Technology stack
- **Frontend:** React, Vite, Tailwind CSS, React Router DOM, Motion, Quill, Marked, Axios, React Hot Toast, Moment.js.
- **Backend:** Node.js, Express, Mongoose, MongoDB Atlas, JWT, Multer, `@google/genai`, ImageKit SDK, dotenv, Nodemon.
- **Deployment/version control:** Vercel and GitHub.

## Features
### Public reader experience
- Homepage with branding, hero section, search, and category filters: All, Technology, Startup, Lifestyle, Finance.
- Responsive blog cards and blog detail pages with title, subtitle, category, author, date, image, and article content.
- Comment submission; only approved comments are publicly visible.
- Newsletter form, footer links, and social sharing links.

### Admin experience
- Admin login and protected dashboard.
- Metrics for published blogs, comments, and drafts.
- Create, edit, publish, unpublish, and delete posts.
- Upload thumbnails and generate editable article drafts with Gemini.
- Review, approve, and delete comments.

## Architecture and folder layout
```text
quick-blog/
├── .github/
│   ├── copilot-instructions.md
│   ├── specs/
│   └── plans/
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       │   └── admin/
│       ├── context/
│       └── pages/
│           └── admin/
├── server/
│   ├── configs/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
├── .gitignore
└── README.md
```

### Frontend routes
- `/` — public homepage
- `/blog/:id` — blog detail
- `/admin` — admin dashboard/login entry
- `/admin/addblog` — create blog
- `/admin/listblog` — manage blogs
- `/admin/comments` — moderate comments

Use nested React Router routes and an admin layout with `<Outlet />`.

### Backend responsibilities
- `configs/`: database, Gemini, and ImageKit setup.
- `controllers/`: request handling and business logic.
- `middleware/`: authentication and upload processing.
- `models/`: Mongoose schemas.
- `routes/`: Express route definitions.
- `server.js`: server setup and route mounting.

## Data models
### Blog
`title` (required string), `subtitle` (string), `description` (required article body), `category` (required string), `image` (required URL), `isPublished` (required boolean), and timestamps (`createdAt`, `updatedAt`).

### Comment
`blog` (required ObjectId reference to Blog), `name` (required string), `content` (required string), `isApproved` (boolean, defaults to `false`), and timestamps.

## Integration flows
### AI content generation
1. Admin enters a title and optionally a subtitle.
2. Client calls `POST /api/blog/generate`.
3. Backend calls Gemini using a server-side API key.
4. Backend returns Markdown.
5. Client parses Markdown with Marked and loads the result into Quill.
6. Admin reviews and edits content before saving or publishing.

### Image upload
1. Admin selects an image.
2. Multer receives the multipart upload.
3. Backend uploads it to ImageKit.
4. ImageKit optimizes it (automatic quality, WebP, max width 1280px).
5. The resulting CDN URL is saved in MongoDB.

### Admin authentication
1. Admin submits credentials to `POST /api/admin/login`.
2. Backend validates credentials using configured environment variables.
3. Backend signs and returns a JWT.
4. Client attaches the token to protected API requests.
5. Backend middleware verifies the token before protected operations.

## API surface
- `POST /api/admin/login` — admin authentication.
- Dashboard statistics endpoint — published blog, comment, and draft counts.
- `GET /api/blog/all` — public blog listing.
- `GET /api/blog/:id` — blog detail.
- `POST /api/blog/generate` — AI content generation.
- Admin-protected blog create/update/publish-toggle/delete endpoints.
- Comment creation and admin moderation endpoints.

Confirm exact request and response schemas during implementation. Deleting a blog must also delete its comments. Public endpoints must filter comments by `isApproved: true`.

## Environment configuration
Keep secrets server-side; never commit `.env` files or expose private keys through frontend variables.

### `server/.env`
```dotenv
PORT=3000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_jwt_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_secure_password
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
GEMINI_API_KEY=your_gemini_api_key
```

### `client/.env`
```dotenv
VITE_BASE_URL=http://localhost:3000
```

Only public values should use the `VITE_` prefix.

## Local development
Run commands manually in the VS Code integrated terminal.

### Frontend setup
```bash
npm create vite@latest client -- --template react
cd client
npm install
npm install tailwindcss @tailwindcss/vite react-router-dom motion moment quill marked axios react-hot-toast
```

### Backend setup
```bash
mkdir server
cd server
npm init -y
npm install express mongoose cors dotenv jsonwebtoken multer @google/genai imagekit
npm install --save-dev nodemon
```

Set `"type": "module"` in `server/package.json` and add:
```json
{
  "scripts": {
    "server": "nodemon server.js"
  }
}
```

Start frontend and backend in separate terminals:
```bash
cd server
npm run server
```
```bash
cd client
npm run dev
```
Expected local URLs: `http://localhost:3000` for the API and `http://localhost:5173` for Vite, unless configured otherwise.

## Recommended build sequence
1. Requirements/specification: scope, user stories, acceptance criteria, constraints, open questions.
2. Architecture and implementation plan: folders, API contracts, data model, dependencies, task order.
3. Frontend foundation: Vite, Tailwind, global styles, assets, routing, shared layout.
4. Public reader UI: navigation, search, filters, cards, detail, comments UI, newsletter, footer.
5. Admin UI: layout/sidebar, login, dashboard, blog editor/list, comment moderation.
6. Backend foundation: Express, environment config, database connection, health check, routes.
7. Data and auth: Mongoose models, login, JWT middleware, protected routes.
8. Blog/comment APIs: CRUD, publishing, public filtering, moderation, cascading deletion.
9. Media pipeline: Multer, ImageKit, validation, stored CDN URL.
10. AI integration: Gemini setup, prompt validation, generation endpoint, Markdown parsing, editor integration.
11. Full-stack integration: Axios base URL, shared state, auth, loading/error states, notifications.
12. Testing and hardening: public/admin flows, authorization, validation, edge cases, responsive UI.
13. Deployment: Vercel configuration, environment variables, SPA routing, production API URL, deployed-flow verification.

## Quality and security requirements
- Enforce admin authorization on the backend; UI hiding is not authorization.
- Validate request bodies, IDs, and uploaded files server-side.
- Keep Gemini and ImageKit private credentials on the backend.
- Reject empty AI prompts.
- Treat AI output as untrusted; safely render or sanitize HTML and avoid unsafe raw HTML injection.
- Initialize Quill once per mounted editor instance using refs/effects.
- Never expose unapproved comments publicly.
- Delete related comments when a blog is deleted.
- On logout, clear the stored token and global Axios authorization header.
- Handle expired/invalid JWTs, missing environment variables, database failures, upload failures, and AI provider errors.
- Avoid double slashes in composed API URLs.
- Ensure production SPA routes support direct navigation and refresh.
- Configure CORS for the deployed frontend origin.
- Verify current Vercel plan/runtime limits rather than assuming them.
- Use an appropriate MongoDB Atlas network policy; do not open database access unnecessarily.

## Testing checklist
- Homepage shows published posts only; search and category filters work together.
- Blog detail handles valid and invalid IDs.
- Comment submission works; only approved comments appear publicly.
- Valid login succeeds; invalid credentials fail; protected endpoints reject unauthenticated requests.
- Admin can create, edit, publish/unpublish, and delete posts.
- Drafts stay out of public listings; comment approval/deletion works.
- Blog deletion removes related comments; logout clears auth state.
- Empty AI prompt and provider errors are handled; generated Markdown is editable.
- Invalid/oversized image uploads are rejected; successful uploads save the ImageKit URL.
- Production frontend/backend integration and nested-route refresh work.

## Copilot Chat working agreement
Use GitHub Copilot Chat in VS Code for planning, implementation, and debugging; do not depend on Copilot CLI.
For each feature:
1. Read the relevant specification and project instructions.
2. Review an implementation plan before coding.
3. Implement only the approved scope.
4. Explain terminal commands and state the directory; the developer runs them manually in VS Code's integrated terminal.
5. Add/update tests where practical.
6. Review the diff and report changed files, behavior, tests, and remaining risks.
7. Never claim a command or test ran unless it actually ran.

Prefer small, reviewable changes, clear separation of concerns, consistent naming, and explicit error handling. Ask for clarification when a requirement affects architecture or security; do not silently invent a decision.

## Decisions to confirm during planning
- Environment-based admin credentials versus a persisted admin-user model.
- Whether newsletter subscriptions need a real email provider in v1.
- Fixed author profile versus author entities.
- Exact API request/response schemas and validation rules.
- Whether editing is included in the first blog-management milestone.
- Upload size/type limits and unused-upload cleanup.
- Vercel runtime/function duration supported by the selected plan.
- Test tooling for frontend and backend.

This file is project context, not a replacement for feature-specific specifications, approved plans, or current provider documentation.
