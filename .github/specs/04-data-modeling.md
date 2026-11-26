# Spec: Data Modeling

## Overview

Add the first MongoDB data models to the Quick Blog backend by defining Mongoose schemas for blog posts and reader comments. This follows the completed Express and MongoDB connection setup and establishes the data structures needed by later API features. This milestone is limited to model definitions and schema validation; it does not implement authentication, routes, controllers, uploads, or media processing.

## Depends on

- The Express backend foundation and MongoDB connection in `server/`.
- The existing `mongoose` dependency in `server/package.json`.
- The Blog and Comment field definitions in `quick-blog-project-guide.md`.

## Routes

No new routes.

## Database changes

Create Mongoose models backed by the default `blogs` and `comments` MongoDB collections. No migration is required.

- **Blog**
  - `title`: required, trimmed string.
  - `subtitle`: optional, trimmed string.
  - `author`: required, trimmed string.
  - `description`: required, trimmed string.
  - `category`: required string, restricted to `Technology`, `Startup`, `Lifestyle`, or `Finance`.
  - `image`: required trimmed string containing a valid HTTP or HTTPS URL.
  - `isPublished`: required boolean, defaulting to `false`.
  - Enable Mongoose timestamps (`createdAt` and `updatedAt`).
- **Comment**
  - `blog`: required ObjectId reference to the `Blog` model.
  - `name`: required, trimmed string.
  - `content`: required, trimmed string.
  - `isApproved`: boolean defaulting to `false`.
  - Enable Mongoose timestamps (`createdAt` and `updatedAt`).

Do not add custom indexes in this milestone; revisit them with the API query patterns. Do not add cascade-delete behavior to the models; comment cleanup belongs with the later blog deletion API.

## Templates

- **Create:** None.
- **Modify:** None.

## Files to change

- No existing files need modification.

## Files to create

- `server/models/Blog.js`
- `server/models/Comment.js`

## New dependencies

No new dependencies. Reuse the existing `mongoose` package.

## Rules for implementation

- Keep models under `server/models/` and use the server's existing ES-module syntax.
- Export the models as the default exports and use the model names `Blog` and `Comment`; the comment reference must use `ref: 'Blog'`.
- Define validation, defaults, and timestamps in the Mongoose schemas. Do not add database connection logic to model files.
- Keep image storage as a URL string only. Do not implement Multer, ImageKit, upload validation, image transformations, or cloud storage.
- Do not add routes, controllers, JWT authentication, authorization middleware, or API behavior.
- Do not implement cascading deletion or comment visibility queries in this milestone.
- Preserve the existing Express startup and MongoDB connection behavior.

## Definition of done

- Importing both models succeeds with the existing Node.js ES-module setup and does not require opening a MongoDB connection.
- A Blog instance with valid required values passes Mongoose validation; missing required fields, an unsupported category, or a malformed/non-HTTP(S) image URL fail validation.
- The Blog `author` field is required and trimmed; missing or whitespace-only author values fail validation.
- Omitting `isPublished` gives a Blog instance the `false` default; `subtitle` remains optional.
- A Comment with a valid Blog ObjectId, name, and content passes validation; missing required values fail validation, and omitted `isApproved` defaults to `false`.
- Both schemas enable timestamps and expose `createdAt` and `updatedAt` paths.
- The Comment schema declares its `blog` field as an ObjectId reference to `Blog`.
- No routes, controllers, authentication, upload handling, provider setup, or frontend files are added or changed.
- Existing backend startup and health-check behavior remains unchanged.
