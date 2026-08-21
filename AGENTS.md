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

**Gallery row naming**

- Equal columns: `{row}-{cols}-{slot}.ext` — e.g. `02-2-1.jpg`, `02-2-2.jpg`
- Mosaic (vertical left + 2 horizontals right): `{row}-v2h-{slot}.ext`
  - `03-v2h-1.jpg` vertical left
  - `03-v2h-2.jpg` horizontal top-right
  - `03-v2h-3.jpg` horizontal bottom-right
- Mosaic (vertical + horizontal, same height): `{row}-vh-{slot}.ext`
  - `04-vh-1.jpg` vertical left
  - `04-vh-2.jpg` horizontal right

Optional: `npm run compress-images` for stills. Gallery videos play muted/looping (GIF-like).

**Thumbnail vs gallery:** the featured thumbnail must never appear again in the project gallery. `app/projects/[slug]/page.tsx` filters by path and identical file contents via `galleryWithoutThumbnail` in `lib/project-media.ts`. Prefer pointing `thumbnail` at a gallery path (e.g. Badweeds `gallery/08.jpg`) when the cover is one of the gallery shots; avoid a separate `thumbnail.jpg` that duplicates `01.jpg`.

Production: https://creative-portfolio-chi-five.vercel.app (deploys from `master`).
