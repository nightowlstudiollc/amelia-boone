# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Site for Amelia Boone (client of Night Owl Studio, LLC). She is an obstacle racing champion / ultrarunner with two separate content sources:

- **WordPress blog** at `ameliabooneracing.com/blog/` — 73 posts (2011–2023), no longer actively updated. Full archive imported.
- **Substack** at `ameliaboone.substack.com` — newer personal essays (2023–present), ~20 posts

This site consolidates both into a single unified blog, with Substack as the ongoing source.

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
pnpm install            # Install dependencies
pnpm run dev            # Start dev server at localhost:4321
pnpm run build          # Build to ./dist/ (astro check → astro build → pagefind → cp index to public/)
pnpm run preview        # Preview production build locally
pnpm run format:check   # Check Prettier formatting (CI enforces this)
pnpm exec prettier --write <file>  # Fix formatting for a specific file
pnpm run lint           # Run ESLint
```

**No test framework** is configured (no Vitest, Jest, etc.). Verification is: `pnpm run build` (type checks + builds) and `pnpm run format:check`.

**Before committing**: Always run `pnpm exec prettier --write <file>` on changed files and verify with `pnpm run format:check` — CI enforces Prettier on all files including blog markdown. Run `pnpm run build` locally before pushing to catch build errors early.

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

## Architecture

### Content Pipeline

Posts live in `src/data/blog/` as `.md` files. Astro's content collections load them via a glob loader configured in `src/content.config.ts`. The schema defines all frontmatter fields including `source` (wordpress/substack) and `originalUrl`.

**Query chain**: `getCollection("blog")` → `postFilter()` (excludes drafts + future posts) → `getSortedPosts()` (sorts by `modDatetime` or `pubDatetime`) → paginated/filtered by page components.

**Slug/URL generation**: `src/utils/getPath.ts` strips the `src/data/blog/` prefix from file paths and slugifies each segment. A file at `src/data/blog/my-post.md` → `/posts/my-post/`.

### Key Files

| File | Role |
|------|------|
| `src/config.ts` | Site-wide config: URL, author, posts-per-page (20), timezone, feature flags |
| `src/content.config.ts` | Content collection schema definition |
| `src/constants.ts` | Social links (Substack, Instagram, LinkedIn) and share link templates |
| `src/utils/postFilter.ts` | Draft/scheduled post filtering (shows all in dev mode) |
| `src/utils/getSortedPosts.ts` | Canonical post sorting (modDatetime takes precedence) |
| `src/utils/getPath.ts` | Post URL generation from file paths |
| `src/utils/slugify.ts` | Slug generation with non-Latin character support (lodash.kebabcase fallback) |
| `src/layouts/PostDetails.astro` | Post navigation layout (prev/next, metadata, share links) |
| `netlify/functions/sync-substack.mts` | Scheduled function: RSS → markdown → GitHub commit via Octokit |

### Layout Hierarchy

`Layout.astro` (head, SEO, theme) → `Main.astro` (breadcrumb, back button, wrapper) → page-specific content. `PostDetails.astro` wraps individual posts with metadata, tags, share links, and prev/next navigation.

### Path Alias

TypeScript path alias `@/*` maps to `src/*` (configured in `tsconfig.json`).

### OG Images

Dynamic OG images generated at build time via Satori (JSX → SVG) + resvg (SVG → PNG). Templates in `src/utils/og-templates/`. Only generates if post has no custom `ogImage` and `SITE.dynamicOgImage` is enabled.

### Search

Pagefind runs post-build (`pagefind --site dist`), generating a client-side search index. The build script copies the index to `public/pagefind/` for static serving. Search UI at `/search` uses `@pagefind/default-ui`.

### Redirects

`netlify.toml` contains 301 redirects from old `ameliabooneracing.com/blog/` URL patterns to the new `/posts/` structure. Also redirects `/blog` and `/blog/` to `/posts`.

## Visual Direction

Minimal, editorial, slightly outdoorsy. Target feel: Runner's World digital ~2022. Clean typography, generous whitespace, one strong accent color, hero imagery with her race photos.

## Deployment Notes

- Netlify auto-deploys on every push to `main`
- `PLAN.md` at repo root is the full project specification

## Operational Notes

### Checking CI Status

`gh pr view --json statusCheckRollup` and `gh pr checks` both fail with "Resource not accessible by personal access token". Use `gh api repos/nightowlstudiollc/amelia-boone/actions/runs` or `gh run view` instead.

### Merge Command

Always use `gh pr merge <N> --repo nightowlstudiollc/amelia-boone --squash --delete-branch` (both flags required); omitting `--delete-branch` causes a pre-merge hook error. Direct pushes to `main` are blocked by a pre-push hook; always use the branch → PR → merge workflow.

### Pre-commit Hooks

A global pre-commit hook (at `~/.config/git/hooks/pre-commit`) runs Semgrep among other checks. If Semgrep fails on a file, add it to `.semgrepignore` in the repo root to unblock the commit.

### Branch Cleanup

Merged Claude branches may not be fully merged locally (history rewrite after `git-filter-repo`); use `git branch -D` (force delete) instead of `git branch -d` for stale Claude branches. `git fetch --prune` may fail with tag clobber errors (`archive/2026-02-23` tag conflict); ignore the tag rejection and proceed.

