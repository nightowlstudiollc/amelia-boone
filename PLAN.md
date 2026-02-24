# PLAN.md — Amelia Boone Demo Site
**Night Owl Studio, LLC** · Client proposal demo  
**Live target**: `https://nightowlstudio.us/proposals/amelia-boone`  
**Local repo**: `/Users/andrewrich/Developer/client/amelia-boone` (archive/ignore prior work)

---

## Context

Amelia Boone is a prospective client. She runs two distinct content sources:

- **WordPress blog** at `ameliabooneracing.com` — ~125 posts (2011–2023), obstacle racing / personal essays. She is no longer actively posting there.
- **Substack** at `ameliaboone.substack.com` ("Race Ipsa Loquitur") — newer personal essays (2024–present), roughly 10–15 posts.

She wants a single site that consolidates both, with Substack as the ongoing source of new content. She has **not** migrated the old WordPress posts to Substack — they are separate corpora.

**This demo is a sales tool**, not the final product. Scope is deliberately narrow:
- A working, attractive scaffold with sample content
- No post-management UI, no sync automation, no CMS editor — those are phase 2
- Hosted at the Night Owl Studio proposals subdirectory so she can poke around at her leisure

---

## Tech Stack Decision

Use **Astro** as the static site generator.

Rationale:
- Best-in-class for content-heavy static sites (Markdown/MDX native)
- Excellent Netlify integration, zero-config deploy
- No JavaScript overhead unless explicitly added (good for a personal blog)
- Large ecosystem of themes; easy to find something minimal and athletic-looking
- Straightforward enough that the actual production build won't require rewrites

**Hosting**: Netlify project `amelia-boone-archive` (already exists, already linked to GitHub)  
**Source control**: `https://github.com/nightowlstudiollc/amelia-boone` (already exists)  
**Preview URL**: `https://amelia-boone-archive.netlify.app/` — this is what gets sent to Amelia  
**Note**: Both the GitHub repo and Netlify project can be wiped clean — start fresh from empty, don't preserve any prior content

---

## Visual Design Direction

Amelia's existing site (`ameliabooneracing.com`) is functional but dated — WordPress default theme, minimal customization. Her personal aesthetic from Instagram/Substack reads as: clean, serious, athletic, not fussy.

Target feel: **minimal, editorial, slightly outdoorsy without being REI-catalog about it**. Think Runner's World digital circa 2022 — good typography, generous whitespace, one strong accent color, hero imagery that leads with her face/race photos rather than graphics.

Find or adapt an Astro theme that has:
- Clean blog list / post layout
- Hero image support on homepage
- Good mobile reading experience (she'll share links; readers will be on phones)
- Minimal nav: Home · Blog · About · (Contact placeholder)

Do **not** attempt to clone her existing site visually. The point is to show her something better.

---

## Step-by-Step Build Plan

### Phase 1 — Scaffold

1. Initialize Astro project with a suitable minimal blog theme (e.g., `astro-theme-cody`, `astrowind`, or similar — pick whichever looks most appropriate after a quick survey)
2. Configure for static output (`output: 'static'`)
3. Force-push to `https://github.com/nightowlstudiollc/amelia-boone` (wipe whatever's there)
4. Netlify project `amelia-boone-archive` is already linked to that repo — confirm deploy triggers and works at `https://amelia-boone-archive.netlify.app/`

### Phase 2 — WordPress Content Scrape

Scrape a **representative sample** of WordPress posts — not all 125. Target ~10–15 posts that span the range of her content:

- A few early obstacle racing posts (2011–2013 era)
- Her most-read / most-referenced posts (check for posts with lots of comments, or posts she references in later writing)
- One or two posts from the final active period (2022–2023)
- The "World's Toughest Mudder Ruined My Life" post — this is a signature piece

**Method**:
```bash
# WordPress exposes a REST API by default; try this first:
curl "https://ameliabooneracing.com/wp-json/wp/v2/posts?per_page=100&page=1" | jq .

# If that's blocked, scrape with wget or a targeted curl loop
# Convert to Markdown with pandoc or a custom script
```

Convert each post to `.md` with appropriate frontmatter:
```yaml
---
title: "Post Title"
date: 2019-04-15
source: wordpress
tags: [racing, obstacle-course]
originalUrl: https://ameliabooneracing.com/blog/post-slug
---
```

The `source: wordpress` tag is important — it supports a future UI indicator like "Originally published on WordPress."

Store in `src/content/blog/`.

### Phase 3 — Substack Content Import

Substack provides an RSS feed at `https://ameliaboone.substack.com/feed`. Use this to pull existing posts.

```bash
curl https://ameliaboone.substack.com/feed
```

Parse the feed, download each post's HTML content, convert to Markdown. Tag with:
```yaml
source: substack
originalUrl: https://ameliaboone.substack.com/p/post-slug
```

Import all available Substack posts (there are only ~10–15, so no need to sample).

### Phase 4 — Homepage / Landing Page

Build a landing page that **echoes the spirit of `ameliabooneracing.com` without aping it**. Key elements to reference:

- Her name prominently (she is the brand)
- Athletic identity: obstacle racing champion, ultrarunner, the pivot to personal essays
- Current focus: the Substack writing, what she's doing now
- Photo: pull a strong image from her public Instagram or existing site (placeholder for demo; she'll provide final assets)

Nav structure:
```
Amelia Boone
├── Home (landing)
├── Blog (unified feed, Substack + WordPress, reverse chron)
├── About (stub — pull from existing "about" page text)
└── Contact (stub form, non-functional for demo)
```

Homepage content strategy:
- Short hero section: name, one-line bio, current writing focus
- 3–4 featured recent posts (pull from Substack — these are the "current" ones)
- Brief "archive" callout linking to older WordPress-sourced posts

### Phase 5 — Deploy and Verify

1. Final deploy to Netlify (auto-triggers on push to main)
2. Confirm accessible at `https://amelia-boone-archive.netlify.app/`
3. Smoke test: all sample posts render, images load, mobile layout is clean
4. Share `https://amelia-boone-archive.netlify.app/` with Amelia

---

## What This Demo Does NOT Include

Be explicit with Amelia when presenting this:

- **No live Substack sync** — the Substack posts shown are a one-time import; new posts won't appear automatically (this is phase 2)
- **No CMS / post editor** — she can't write new posts through the site UI (also phase 2)
- **No domain migration** — this is a proposals subdomain; connecting `ameliabooneracing.com` is a separate step once she decides to proceed
- **No comments** — WordPress comments are not preserved (could be reconsidered, but Disqus/etc. is probably not what she wants)

---

## Files to Produce

```
amelia-boone/
├── PLAN.md                  ← this file
├── astro.config.mjs
├── package.json
├── src/
│   ├── content/
│   │   └── blog/
│   │       ├── [wordpress-posts].md   (~10-15 files)
│   │       └── [substack-posts].md    (~10-15 files)
│   ├── pages/
│   │   ├── index.astro      (landing page)
│   │   ├── blog/
│   │   │   ├── index.astro  (blog list)
│   │   │   └── [...slug].astro
│   │   ├── about.astro      (stub)
│   │   └── contact.astro    (stub)
│   └── layouts/
│       └── BlogPost.astro
└── public/
    └── [images]
```

---

## Notes on Prior Work

There is a local repo at `/Users/andrewrich/Developer/client/amelia-boone` with earlier iteration work from a previous Claude Code session. **Do not build on this** — start fresh. Archive or `git archive` it if you want to keep it, but the earlier work was exploring different directions and isn't worth untangling.

---

## Open Questions (Not Blocking)

- Should posts be paginated on the blog list, or is a single scrollable list fine for the demo? (Probably single list is fine — it's a demo)
- Amelia's Substack is paywalled for some posts — handle this by importing what's available via RSS (free posts only) and noting "subscriber content" for any that are gated
