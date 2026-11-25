# Spec: Admin Dashboard UI & Component Architecture

## Overview

Create the first admin-facing frontend experience for QuickBlog: an admin shell with nested routes, a login view, dashboard metrics and recent posts, and the UI surfaces for creating blogs, managing blog posts, and moderating comments. This follows the completed public landing page and establishes a reusable component architecture for later backend integration.

The existing application is a React/Vite SPA in `fronted/`. It currently has public home and blog-detail routes, reusable public components, dashboard icons, and static `dashboard_data`, `blog_data`, and `comments_data` fixtures, but no admin pages, admin components, backend, or database implementation. Keep this feature frontend-only. Use existing fixture data for the admin presentation, and do not imply that login, content changes, or moderation actions are persisted or secured until backend APIs are implemented.

## Depends on

- Completed public landing page and blog-detail routes in `fronted/`.
- Existing React, React Router DOM, Tailwind CSS, and dashboard assets in `fronted/src/assets/assets.js`.
- The existing `dashboard_data`, `blog_data`, and `comments_data` exports for initial admin UI content.

## Routes

- `/admin` - Admin entry route; display the login view when no authenticated session is available, otherwise display the dashboard.
- `/admin/addblog` - Blog creation interface.
- `/admin/listblog` - Blog management interface.
- `/admin/comments` - Comment moderation interface.

Nest the admin routes under a shared layout using React Router's `<Outlet />`. Route guards are a frontend navigation aid only and must not be presented as backend authorization.

## Database changes

No database changes. The repository has no backend or database implementation. Use existing local fixtures, including `comments_data`, for display and keep write actions non-persistent until API contracts and backend behavior are specified.

## Templates

- **Create:** `fronted/src/pages/admin/Layout.jsx`, `fronted/src/pages/admin/Dashboard.jsx`, `fronted/src/pages/admin/AddBlog.jsx`, `fronted/src/pages/admin/ListBlog.jsx`, `fronted/src/pages/admin/Comments.jsx`, `fronted/src/components/admin/Sidebar.jsx`, `fronted/src/components/admin/Login.jsx`, `fronted/src/components/admin/BlogTableItem.jsx`, and `fronted/src/components/admin/CommentTableItem.jsx`.
- **Modify:** `fronted/src/App.jsx` to add the nested admin routes. Modify `fronted/src/assets/assets.js` only if an existing admin asset needs to be exposed or a required asset mapping is missing.

## Files to change

- `fronted/src/App.jsx`
- `fronted/package.json`
- `fronted/package-lock.json`

## Files to create

- `fronted/src/pages/admin/Layout.jsx`
- `fronted/src/pages/admin/Dashboard.jsx`
- `fronted/src/pages/admin/AddBlog.jsx`
- `fronted/src/pages/admin/ListBlog.jsx`
- `fronted/src/pages/admin/Comments.jsx`
- `fronted/src/components/admin/Sidebar.jsx`
- `fronted/src/components/admin/Login.jsx`
- `fronted/src/components/admin/BlogTableItem.jsx`
- `fronted/src/components/admin/CommentTableItem.jsx`

## New dependencies

- `quill` for the rich-text editor in the blog creation interface.

## Rules for implementation

- Build on the existing React/Vite app under `fronted/`; do not create a second frontend or duplicate existing public components.
- Use React function components and React Router nested routes with an admin layout and `<Outlet />`.
- Reuse existing dashboard icons and `dashboard_data`/`blog_data` exports; do not duplicate fixture content or assets.
- Reuse `comments_data` for pending and approved comment rows; do not invent or duplicate sample comments.
- Keep shared admin navigation and repeated table rows in reusable components under `fronted/src/components/admin/`.
- Use existing Tailwind CSS and theme variables from `fronted/src/index.css`; avoid adding one-off hardcoded theme colors.
- Make the sidebar and all admin pages responsive and keyboard accessible.
- Initialize Quill once per mounted editor instance using refs and effects; clean up on unmount.
- Provide clear loading, empty, validation, and error states where relevant.
- Do not implement backend routes, database models, credential verification, or claims of secure authorization in this UI-only feature. Do not treat client-side route guards as security.
- Do not simulate successful login, blog persistence, or comment moderation when no API exists. Any temporary UI interactions must be clearly non-persistent.
- Confirm login and dashboard API request/response contracts during the implementation plan before wiring the interface to backend services.
- No `.github/project-instructions.md` exists in the repository; follow `.github/copilot-instructions.md` and the established QuickBlog conventions.

## Definition of done

- Visiting `/admin` renders an accessible login view when there is no authenticated session; the UI does not claim that client-side checks secure backend operations.
- The admin layout renders consistent navigation and nested content at `/admin`, `/admin/addblog`, `/admin/listblog`, and `/admin/comments`.
- The dashboard displays published-blog, comment, and draft metrics and a recent-post table using the existing fixture data.
- The add-blog page renders labeled title, subtitle, category, image, publication controls, and a Quill editor; the editor initializes once and is cleaned up when the page unmounts.
- The blog-management page renders blog rows with clear publication state and action affordances without falsely reporting non-persistent actions as saved.
- The comments page distinguishes pending and approved entries from `comments_data` and exposes moderation affordances without falsely reporting non-persistent changes as saved.
- Admin navigation and content remain usable on mobile, tablet, and desktop widths with no horizontal overflow.
- Direct navigation and refresh on each admin route render the correct page.
- Existing public home and blog-detail routes continue to render unchanged.
- `npm run build` and `npm run lint` complete successfully from `fronted/`.




