# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Demo site for Amelia Boone (prospective client of Night Owl Studio, LLC). She is an obstacle racing champion / ultrarunner with two separate content sources:

- **WordPress blog** at `ameliabooneracing.com` — ~125 posts (2011–2023), no longer actively updated
- **Substack** at `ameliaboone.substack.com` — newer personal essays (2024–present), ~10–15 posts

This site consolidates both into a single unified blog, with Substack as the ongoing source. **This is a sales demo**, not a finished product — no post-management UI, no sync automation.

**Preview URL**: `https://amelia-boone-archive.netlify.app/`
**GitHub**: `https://github.com/nightowlstudiollc/amelia-boone`
**Hosting**: Netlify project `amelia-boone-archive` — auto-deploys on push to main

## Tech Stack

- **Framework**: [Astro](https://astro.build/) with `output: 'static'`
- **Content**: Markdown files in `src/content/blog/` via Astro content collections
- **Deployment**: Netlify (zero-config, linked to GitHub repo)

## Commands

Once the Astro project is initialized:

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at localhost:4321
npm run build        # Build to ./dist/
npm run preview      # Preview production build locally
```

## Content Architecture

All blog posts live in `src/content/blog/` as `.md` files with this frontmatter schema:

```yaml
---
title: "Post Title"
date: 2019-04-15
source: wordpress   # or: substack
tags: [racing, obstacle-course]
originalUrl: https://ameliabooneracing.com/blog/post-slug
---
```

The `source` field is critical — it enables future UI treatment like "Originally published on WordPress" badges. Never omit it.

**WordPress content**: ~10–15 representative posts scraped from `ameliabooneracing.com/wp-json/wp/v2/posts`. Target posts that span the full date range, include high-engagement posts, and specifically include "World's Toughest Mudder Ruined My Life."

**Substack content**: All available posts from RSS feed at `https://ameliaboone.substack.com/feed`. Free posts only — note any paywalled posts as "subscriber content."

## Page Structure

```
/                   → index.astro (landing: hero, 3-4 featured Substack posts, archive callout)
/blog               → blog/index.astro (unified feed, reverse chronological, all sources)
/blog/[slug]        → blog/[...slug].astro
/about              → about.astro (stub, pulled from existing site text)
/contact            → contact.astro (stub, non-functional form)
```

## Visual Direction

Minimal, editorial, slightly outdoorsy. Target feel: Runner's World digital ~2022. Clean typography, generous whitespace, one strong accent color, hero imagery with her race photos. Do **not** replicate her existing WordPress site — show her something better.

## Deployment Notes

- Netlify auto-deploys on every push to `main`
- The GitHub repo and Netlify project can be force-pushed to — no prior work to preserve
- `PLAN.md` at repo root is the full project specification; consult it for detailed content sourcing instructions
