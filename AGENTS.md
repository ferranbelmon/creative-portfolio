<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Single service: a Next.js 16 static portfolio site (no backend/database/env vars required). Package manager is npm (`package-lock.json`); dependencies are installed by the startup update script.

- Dev server: `npm run dev` serves on http://localhost:3000. Note it runs `next dev --webpack` (webpack, not turbopack) even though `next.config.ts` sets a `turbopack.root`.
- Lint: `npm run lint` (flat config `eslint.config.mjs`). Build: `npm run build`. Scripts are in `package.json`.
- Routing gotcha: `/about` is not a standalone page — it 307-redirects to `/?about=1`, which renders About as a modal overlay on the homepage.
- The `scripts/*.mjs` image tooling (`compress-images`, `download-galleries`, etc.) is optional and only needed when regenerating gallery assets; not required to run or test the site.
