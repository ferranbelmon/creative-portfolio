<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Media / gallery workflow

Project media lives in `public/images/projects/{id}-{slug}/gallery/`. Uploading a file alone does **not** show it on the site — paths must also be listed in `content/projects.ts`.

Fast path after the user uploads to GitHub (or drops files locally):

```bash
npm run sync-galleries
```

That script renames messy uploads (e.g. WhatsApp filenames) to the next free `NN.ext` and rewrites each project's `images: [...]` from disk. Prefer telling the user: upload into the project `gallery/` folder, then ask the agent to run `npm run sync-galleries` and merge.

Optional: `npm run compress-images` for stills. Gallery videos play muted/looping (GIF-like).

Production: https://creative-portfolio-chi-five.vercel.app (deploys from `master`).
