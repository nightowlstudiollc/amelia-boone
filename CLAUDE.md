# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Demo site for Amelia Boone (prospective client of Night Owl Studio, LLC). She is an obstacle racing champion / ultrarunner with two separate content sources:

- **WordPress blog** at `ameliabooneracing.com/blog/` — 73 posts (2011–2023), no longer actively updated. Full archive imported.
- **Substack** at `ameliaboone.substack.com` — newer personal essays (2023–present), ~20 posts

This site consolidates both into a single unified blog, with Substack as the ongoing source. **This is a sales demo**, not a finished product.

**Preview URL**: `https://amelia-boone-archive.netlify.app/`
**GitHub**: `https://github.com/nightowlstudiollc/amelia-boone`
**Hosting**: Netlify project `amelia-boone-archive` — auto-deploys on push to main

## Tech Stack

- **Framework**: [Astro](https://astro.build/) with `output: 'static'`
- **Package manager**: **pnpm** (not npm)
- **Content**: Markdown files in `src/data/blog/` (not `src/content/blog/`)
- **Search**: Pagefind (runs automatically as part of build — do not run separately)
- **Deployment**: Netlify (zero-config, linked to GitHub repo)

## Commands

```bash
pnpm install         # Install dependencies
pnpm run dev         # Start dev server at localhost:4321
pnpm run build       # Build to ./dist/ (runs astro check + astro build + pagefind)
pnpm run preview     # Preview production build locally
```

## Content Architecture

All blog posts live in **`src/data/blog/`** as `.md` files with this exact frontmatter schema:

```yaml
---
title: "Post Title"
pubDatetime: 2018-04-02T12:00:00Z   # ISO 8601, always include time component
description: "One-sentence summary, ~150 chars"
source: wordpress                    # or: substack
originalUrl: "https://..."
tags:
  - racing                           # lowercase, hyphenated, 1-3 per post
draft: false
featured: false                      # only true for ~4-5 top posts total
---
```

**Critical**: field is `pubDatetime` (not `date`). `draft: false` always. `featured: true` on at most 4-5 posts.

**WordPress content**: 73 posts scraped from `ameliabooneracing.com/blog/wp-json/wp/v2/posts`. Full archive imported via `import_wp.py`. WP REST API is at `/blog/wp-json/`, not `/wp-json/`.

**Substack content**: ~20 posts from RSS at `https://ameliaboone.substack.com/feed`. Free posts only. Hourly Netlify scheduled function (`netlify/functions/sync-substack.mts`) auto-syncs new posts via GitHub API.

**Substack images**: Hotlinked from `substackcdn.com` — do NOT download. 18 image references across Substack posts, all on `substackcdn.com`. URLs are stable as long as her Substack account is active. Decision logged 2026-03-11.

**Footnotes**: In-body footnote references use `[N](#footnote-N)` and scroll to `<a id="footnote-N">` anchors at the top of each footnote in the footnote section. The sync function normalizes Substack's footnote back-links (`[N](#footnote-anchor-N)`) into `<a id="footnote-N"></a>N. Text` format automatically. Fixed in 6 archived posts as of 2026-03-16.

## Page Structure

```
/                   → index.astro (landing: 4 recent posts in hero, "Worth Reading" featured section)
/posts              → blog/index.astro (unified feed, reverse chronological, all sources)
/posts/[slug]       → blog/[...slug].astro
/about              → about.astro
/contact            → contact.astro (Netlify Forms enabled)
/contact/thanks     → contact/thanks.astro (post-submit success page)
/race-schedule      → race-schedule.astro (full race history 2011–2018)
/press              → press.astro (podcasts, articles, media coverage)
```

## Current Status (as of 2026-03-11)

- **73 WordPress posts** imported (full archive)
- **~20 Substack posts** imported
- **4 featured posts**: barkley2018, how-worlds-toughest-mudder-ruined-my-life, substack-are-athletes-obligated-to-speak-out-on-social-media, substack-so-this-is-40
- **Hourly Substack sync**: Netlify scheduled function (requires `GITHUB_TOKEN` env var in Netlify dashboard)

## Visual Direction

Minimal, editorial, slightly outdoorsy. Target feel: Runner's World digital ~2022. Clean typography, generous whitespace, one strong accent color, hero imagery with her race photos.

## Deployment Notes

- Netlify auto-deploys on every push to `main`
- `PLAN.md` at repo root is the full project specification
