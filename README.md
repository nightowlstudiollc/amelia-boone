# Amelia Boone

[![Netlify Status](https://api.netlify.com/api/v1/badges/dd31fbad-e423-40b9-b573-d244d5631d59/deploy-status)](https://app.netlify.com/projects/amelia-boone-archive/deploys)

Personal blog for Amelia Boone — obstacle racing champion, ultrarunner, attorney, and writer.

Live at [amelia-boone-archive.netlify.app](https://amelia-boone-archive.netlify.app) (preview; final domain TBD).

## How to edit the site

📖 **[Complete Editing Guide: EDITING-COOKBOOK.md](EDITING-COOKBOOK.md)** — step-by-step recipes for all common edits.

You don't need any special software. Everything happens on GitHub in your browser.

### Quick version

1. Go to [`src/data/blog/`](https://github.com/nightowlstudiollc/amelia-boone/tree/main/src/data/blog) to find your posts, or [`src/pages/about.md`](https://github.com/nightowlstudiollc/amelia-boone/blob/main/src/pages/about.md) for the About page.
2. Click the file you want to edit, then click the **pencil icon** (✏️).
3. Make your changes. The post content starts after the second `---` line.
4. Scroll down to **"Commit changes"**, write a short note about what you changed, and click **"Commit changes"**.
5. Your site updates automatically in 2–3 minutes.

That's it. You won't break anything — every change is tracked and reversible.

### What you can edit yourself

- Any blog post (fix typos, rewrite paragraphs, update a link)
- The About page
- Tags on a post

For anything structural — new pages, layout changes, adding or removing nav items — ask Andrew.

### Substack posts

New posts you publish on Substack will sync to the site automatically, usually within an hour. You don't need to do anything.

If a synced post looks wrong (formatting, missing content, etc.), let Andrew know and he can fix it.

## Technical notes

- **Framework**: [Astro](https://astro.build/) with `output: 'static'`
- **Package manager**: pnpm
- **Content**: Markdown files in `src/data/blog/`
- **Search**: Pagefind (runs automatically during build)
- **Hosting**: Netlify — auto-deploys on push to `main`
- **Substack sync**: Netlify scheduled function, runs hourly, append-only

### Commands

```bash
pnpm install       # Install dependencies
pnpm run dev       # Dev server at localhost:4321
pnpm run build     # Production build (includes pagefind indexing)
pnpm run preview   # Preview production build locally
```

### File structure

```
src/data/blog/          Blog posts (Markdown)
src/pages/              Static pages (About, Press, Race Schedule, Contact)
src/drafts/             Pages in progress (not live)
public/images/wp/       Migrated WordPress images
netlify/functions/      Substack sync automation
docs/                   Documentation and plans
```

## Credits

Site built by [Night Owl Studio LLC](https://nightowlstudio.us), Spokane, WA.
