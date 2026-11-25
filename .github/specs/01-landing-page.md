# Spec: Landing Page

## Overview

Build the public Quick Blog landing page as the first reader-facing feature. The page introduces the publication, lets readers search published articles and filter them by category, presents article cards with key metadata, and provides newsletter and footer destinations. The implementation should use the static blog data and assets already available in the frontend until the public blog API is implemented.

## Depends on

- Vite React frontend initialized in `fronted/`.
- Quick Blog visual assets and `blog_data`/`blogCategories` exports available in `fronted/src/assets/assets.js`.
- React Router DOM, Tailwind CSS, and Motion dependencies available before implementation.

## Routes

- `/` - Public landing page.

No additional routes are required for this step.

## Database changes

No database changes.

## Templates

- **Create:** React components under `fronted/src/components/` for `Navbar`, `Header`, `BlogList`, `BlogCard`, `Newsletter`, and `Footer`.
- **Modify:** `fronted/src/App.jsx`, `fronted/src/main.jsx`, `fronted/src/index.css`, `fronted/src/App.css`, `fronted/index.html`, and `fronted/vite.config.js` as needed for routing and Tailwind integration.

## Files to change

- `fronted/src/App.jsx`
- `fronted/src/main.jsx`
- `fronted/src/index.css`
- `fronted/src/App.css`
- `fronted/index.html`
- `fronted/vite.config.js`
- `fronted/package.json`

## Files to create

- `fronted/src/components/Navbar.jsx`
- `fronted/src/components/Header.jsx`
- `fronted/src/components/BlogList.jsx`
- `fronted/src/components/BlogCard.jsx`
- `fronted/src/components/Newsletter.jsx`
- `fronted/src/components/Footer.jsx`
- `fronted/src/pages/Home.jsx`

## New dependencies

- `react-router-dom`
- `tailwindcss`
- `@tailwindcss/vite`
- `motion`

## Rules for implementation

- Use React function components and hooks with React 19-compatible patterns.
- Use the existing exported `blog_data`, `blogCategories`, and `assets` from `fronted/src/assets/assets.js`; do not duplicate blog content or image imports.
- Show only entries with `isPublished: true` when filtering local blog data.
- Combine the search query and selected category as one filter; neither filter may silently reset the other.
- Search by article title and subtitle and perform case-insensitive matching.
- Use category values exactly: All, Technology, Startup, Lifestyle, Finance.
- Use accessible native form controls and labels, keyboard-visible focus styles, semantic heading hierarchy, descriptive image alt text, and sufficient color contrast.
- Preserve the Quick Blog name and public branding in the navigation and metadata.
- Make the page responsive across mobile, tablet, and desktop widths.
- Use Tailwind utility classes for layout and styling, with project color variables in `fronted/src/index.css` instead of scattered hardcoded color values where theme colors are reused.
- Keep the landing-page implementation frontend-only; do not add authentication, database access, API calls, or newsletter subscriptions in this step.
- Use an explicit empty-result state when no local blog matches the active search and category filters.
- Use Motion only for lightweight UI transitions such as category selection or card reveal; do not block rendering or add excessive animation.
- Use React Router's browser router and define `/` in `App.jsx`.

## Definition of done

- Running `npm run dev` from `fronted/` starts the Vite application and `/` renders the Quick Blog landing page.
- The navbar displays the Quick Blog logo and an admin entry link targeting `/admin`.
- The header renders the hero title, supporting subtitle, AI feature tag, and a functional search input.
- Typing a case-insensitive search term filters displayed published blog cards by title or subtitle.
- Selecting All, Technology, Startup, Lifestyle, or Finance filters the list, and category and search filters remain combined.
- Selecting a category uses the existing Motion integration or a similarly stable animated selector without layout or console errors.
- Published cards display an image, category, title, subtitle, and visible route-ready article link.
- An empty-result state appears when the active filters match no blog.
- The newsletter form provides an accessible email field and clear submission feedback, while avoiding a real service call.
- The footer and social destinations render with working internal or external URL targets.
- The page has no horizontal overflow and remains usable at mobile, tablet, and desktop widths.
- `npm run build` completes successfully from `fronted/`.
- `npm run lint` completes with no new lint errors in files changed for the landing page.
- Existing assets, package setup, and repository files outside the landing-page scope remain unchanged.
