# Post-Call Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the 11 CCCLI-actionable items from the March 11, 2026 post-call GitHub issues for the Amelia Boone demo site.

**Architecture:** Astro 5 static site, content in `src/data/blog/*.md`, layouts in `src/layouts/`, components in `src/components/`. No database. Netlify Forms for contact. Netlify scheduled functions for Substack sync. All changes go through PRs on `nightowlstudiollc/amelia-boone`.

**Tech Stack:** Astro 5, TypeScript, Tailwind CSS, pnpm, Netlify. No test framework (Astro static build + visual inspection is the test loop).

---

## Key Facts (Read Before Touching Anything)

- **Content path**: `src/data/blog/` — NOT `src/content/blog/`
- **Frontmatter**: `pubDatetime` (not `date`), `source: wordpress|substack`, `featured: true/false`
- **Build command**: `pnpm run build` (runs astro check + astro build + pagefind)
- **Dev server**: `pnpm run dev` → localhost:4321
- **WP image domain**: `ameliabooneracing.info` (NOT `.com` — the call notes say `.com` but the actual posts use `.info`)
- **Substack images**: on `substackcdn.com` — hotlink only, do NOT download
- **Post layout**: `src/layouts/PostDetails.astro`
- **Static page layout**: `src/layouts/AboutLayout.astro` (used by `src/pages/about.md`)
- **Nav**: `src/components/Header.astro` — add new pages here
- **Netlify config**: `netlify.toml`

---

## Task 1: WP Image Migration (Issue #1)

**Priority: High**

Download all images from `ameliabooneracing.info/wp-content/uploads/` to `public/images/wp/` and rewrite markdown references.

**Files:**
- Create: `migrate_images.py` (run once, then delete or keep as archive tooling)
- Modify: All `src/data/blog/*.md` files that contain `ameliabooneracing.info` image URLs

**Step 1: Count and sample existing image references**

```bash
grep -roh "https\?://[^)\"' ]*wp-content[^)\"' ]*" src/data/blog/*.md | wc -l
grep -roh "https\?://[^)\"' ]*wp-content[^)\"' ]*" src/data/blog/*.md | sort -u | head -10
```

Expected: ~344 total references, domain is `ameliabooneracing.info` (NOT `.com`).

**Step 2: Write the migration script**

Create `migrate_images.py` at the repo root:

```python
#!/usr/bin/env python3
"""
Download WP images from ameliabooneracing.info and rewrite markdown references.
Run from repo root: python migrate_images.py
"""
import re
import os
import ssl
import urllib.request
from pathlib import Path

# Match both http and https, and both ameliabooneracing.info and ameliabooneracing.com
IMG_PATTERN = re.compile(
    r'(https?://(?:www\.)?ameliabooneracing\.(?:com|info)/wp-content/uploads/([^)\]"\'> \n]+))'
)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

failed = []
downloaded = 0
skipped = 0
rewritten = 0

for md_file in sorted(Path("src/data/blog").glob("*.md")):
    content = md_file.read_text(encoding="utf-8")
    matches = IMG_PATTERN.findall(content)
    if not matches:
        continue

    new_content = content
    for url, rel_path in matches:
        # Clean up any trailing punctuation that got captured
        rel_path = rel_path.rstrip(".,;)")
        url_clean = f"http://ameliabooneracing.info/wp-content/uploads/{rel_path}"
        local_path = Path("public/images/wp") / rel_path
        local_ref = f"/images/wp/{rel_path}"

        local_path.parent.mkdir(parents=True, exist_ok=True)

        if not local_path.exists():
            try:
                req = urllib.request.Request(
                    url_clean,
                    headers={"User-Agent": "Mozilla/5.0"}
                )
                with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
                    local_path.write_bytes(resp.read())
                print(f"  DL: {rel_path}")
                downloaded += 1
            except Exception as e:
                print(f"FAIL: {url_clean} — {e}")
                failed.append(url_clean)
                continue
        else:
            skipped += 1

        new_content = new_content.replace(url, local_ref)

    if new_content != content:
        md_file.write_text(new_content, encoding="utf-8")
        rewritten += 1
        print(f"Rewrote: {md_file.name}")

print(f"\nDone. Downloaded: {downloaded}, Skipped (cached): {skipped}, Files rewritten: {rewritten}")
if failed:
    print(f"\nFailed ({len(failed)}):")
    for f in failed:
        print(f"  {f}")
```

**Step 3: Run the script**

```bash
python migrate_images.py 2>&1 | tee image_migration.log
```

Wait for completion. This downloads ~100-200 unique images.

**Step 4: Verify**

```bash
# No remaining ameliabooneracing references in body content (OK if they appear in originalUrl frontmatter)
grep -rn "ameliabooneracing" src/data/blog/*.md | grep -v "^.*originalUrl:" | grep -v "^.*:$"

# Images exist locally
ls public/images/wp/ | head -5
find public/images/wp -name "*.jpg" | wc -l
```

Expected: 0 remaining references in post bodies. Nonzero image count.

**Step 5: Build to verify no breakage**

```bash
pnpm run build 2>&1 | tail -20
```

Expected: Build succeeds.

**Step 6: Commit**

```bash
git add src/data/blog/ public/images/wp/ migrate_images.py
git commit -m "feat: migrate WP images to public/images/wp/, rewrite markdown references

Downloaded N images from ameliabooneracing.info. Failed: [list or 'none'].
Rewritten in M post files."
```

---

## Task 2: Homepage Restructure — Recent Posts + Highlights Section (Issue #5)

**Priority: High**

Change homepage hero to show 4 most-recent posts (by `pubDatetime`), and add a separate "Highlights" section below for `featured: true` posts.

**Files:**
- Modify: `src/pages/index.astro`

**Step 1: Read the current index.astro**

Read `src/pages/index.astro` fully. The current code filters `featuredPosts` for the hero and renders them in a `<div id="featured">` box inside the hero section.

**Step 2: Update the data fetching and rendering**

Replace the frontmatter section:

```astro
---
import { getCollection } from "astro:content";
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Footer from "@/components/Footer.astro";
import LinkButton from "@/components/LinkButton.astro";
import Card from "@/components/Card.astro";
import getSortedPosts from "@/utils/getSortedPosts";
import IconArrowRight from "@/assets/icons/IconArrowRight.svg";

const posts = await getCollection("blog");
const sortedPosts = getSortedPosts(posts);
const recentPosts = sortedPosts.slice(0, 4);
const highlightPosts = sortedPosts.filter(({ data }) => data.featured);
---
```

In the hero section, replace the `featuredPosts` references with `recentPosts`:

```astro
{
  recentPosts.length > 0 && (
    <div
      id="recent"
      class="relative z-10 ml-6 max-w-md rounded-t-2xl border border-white/10 bg-black/20 px-4 pt-8 pb-6 text-white/90 backdrop-blur-xl sm:ml-12"
    >
      <h2 class="text-2xl font-semibold tracking-wide text-white">
        Recent Writing
      </h2>
      <ul>
        {recentPosts.map(data => (
          <Card variant="h3" {...data} />
        ))}
      </ul>
      <div class="mt-6 text-center">
        <LinkButton href="/posts/">
          All Posts
          <IconArrowRight class="inline-block rtl:-rotate-180" />
        </LinkButton>
      </div>
    </div>
  )
}
```

Add a Highlights section **after** the hero `</section>` close tag, before the archive callout:

```astro
<!-- Highlights section -->
{
  highlightPosts.length > 0 && (
    <section class="app-layout py-10">
      <h2 class="mb-4 text-xl font-semibold">Worth Reading</h2>
      <ul>
        {highlightPosts.map(data => (
          <Card {...data} />
        ))}
      </ul>
    </section>
  )
}
```

**Step 3: Dev server visual check**

```bash
pnpm run dev
```

Open localhost:4321. Verify:
- Hero box shows 4 most-recent posts (check dates — most recent should be newest Substack)
- "Worth Reading" section appears below hero with the 4 featured posts
- Both sections render correctly on mobile (resize browser)

**Step 4: Build check**

```bash
pnpm run build 2>&1 | tail -10
```

Expected: success.

**Step 5: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: homepage shows recent posts in hero, featured posts in Highlights section"
```

---

## Task 3: Contact Form — Wire Up Netlify Forms (Issue #6)

**Priority: High**

Enable Netlify Forms on the contact page so submissions are captured. Add a success page. Note: email notification forwarding to Amelia must be configured manually in Netlify dashboard.

**Files:**
- Modify: `src/pages/contact.astro`
- Create: `src/pages/contact/thanks.astro`

**Step 1: Update the form in contact.astro**

Add `netlify` and `data-netlify="true"` to the form, add the hidden form-name field, add `required` attributes, and set the `action` to redirect to the thanks page:

```astro
<form
  class="max-w-lg space-y-5"
  name="contact"
  method="POST"
  data-netlify="true"
  action="/contact/thanks"
>
  <input type="hidden" name="form-name" value="contact" />
  <div>
    <label for="name" class="mb-1 block text-sm font-medium">Name</label>
    <input
      type="text"
      id="name"
      name="name"
      required
      autocomplete="name"
      class="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-accent"
      placeholder="Your name"
    />
  </div>
  <div>
    <label for="email" class="mb-1 block text-sm font-medium">Email</label>
    <input
      type="email"
      id="email"
      name="email"
      required
      autocomplete="email"
      class="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-accent"
      placeholder="you@example.com"
    />
  </div>
  <div>
    <label for="message" class="mb-1 block text-sm font-medium">Message</label>
    <textarea
      id="message"
      name="message"
      required
      rows={5}
      class="w-full rounded border border-border bg-background px-3 py-2 text-sm focus:outline-accent"
      placeholder="What's on your mind?"
    ></textarea>
  </div>
  <button
    type="submit"
    class="rounded bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
  >
    Send Message
  </button>
</form>
```

**Step 2: Create the thanks page**

Create `src/pages/contact/thanks.astro`:

```astro
---
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Footer from "@/components/Footer.astro";
---

<Layout title="Message Sent | Amelia Boone">
  <Header />
  <main id="main-content" class="app-layout py-12">
    <h1 class="mb-4 text-3xl font-bold">Message received.</h1>
    <p class="mb-6 opacity-75">
      Thanks for reaching out. I'll get back to you when I can.
    </p>
    <a
      href="/"
      class="rounded bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
    >
      Back to home
    </a>
  </main>
  <Footer />
</Layout>
```

**Step 3: Build check**

```bash
pnpm run build 2>&1 | tail -10
```

**Step 4: Commit**

```bash
git add src/pages/contact.astro src/pages/contact/thanks.astro
git commit -m "feat: wire up Netlify Forms on contact page, add /contact/thanks success page

TODO (Andrew): Configure email notification in Netlify dashboard:
  amelia-boone-archive → Forms → contact → Notifications → Add email"
```

---

## Task 4: Add Substack Discussion Link to Post Footer (Issue #10)

**Priority: Low — but 5 minutes, do it**

Add "Read comments on Substack →" link at the bottom of Substack post pages.

**Files:**
- Modify: `src/layouts/PostDetails.astro`

**Step 1: Read PostDetails.astro**

The file is at `src/layouts/PostDetails.astro`. The post data is available via `post.data`. The `source` and `originalUrl` fields are in `post.data`.

Note: The destructuring at the top doesn't pull `source` or `originalUrl`. We need to access `post.data.source` and `post.data.originalUrl` directly.

**Step 2: Add the discussion link**

Insert after the `<ShareLinks />` line and before the `<hr class="my-6 border-dashed" />` that precedes prev/next buttons:

```astro
{post.data.source === "substack" && post.data.originalUrl && (
  <div class="my-6">
    <a
      href={post.data.originalUrl}
      target="_blank"
      rel="noopener noreferrer"
      class="text-sm text-accent/80 underline decoration-dashed underline-offset-4 hover:text-accent"
    >
      Read comments and join the discussion on Substack →
    </a>
  </div>
)}
```

**Step 3: Dev server check**

```bash
pnpm run dev
```

Open a Substack post (e.g., `/posts/substack-so-this-is-40`) and verify the link appears below the share links. Open a WP post and verify it does NOT appear.

**Step 4: Build check**

```bash
pnpm run build 2>&1 | tail -10
```

**Step 5: Commit**

```bash
git add src/layouts/PostDetails.astro
git commit -m "feat: add Substack discussion link to Substack post footers"
```

---

## Task 5: Substack Logo Badge (Issue #4)

**Priority: Low — but visual polish**

Replace the text-only "Substack" badge in post cards with the official Substack "S" logo SVG.

**Files:**
- Create: `src/assets/icons/IconSubstack.svg`
- Modify: `src/components/Card.astro`

**Step 1: Create the Substack SVG icon**

The official Substack orange "S" mark. Create `src/assets/icons/IconSubstack.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
</svg>
```

**Step 2: Update Card.astro**

Import the icon and update the source badge to use it for Substack posts:

```astro
---
import type { CollectionEntry } from "astro:content";
import { slugifyStr } from "@/utils/slugify";
import { getPath } from "@/utils/getPath";
import Datetime from "./Datetime.astro";
import IconSubstack from "@/assets/icons/IconSubstack.svg";

type Props = {
  variant?: "h2" | "h3";
} & CollectionEntry<"blog">;

const { variant: Heading = "h2", id, data, filePath } = Astro.props;

const { title, description, source, ...props } = data;

const sourceLabel =
  source === "wordpress"
    ? "WordPress"
    : source === "substack"
      ? "Substack"
      : null;
---

<li class="my-6">
  <a
    href={getPath(id, filePath)}
    class:list={[
      "inline-block text-lg font-medium text-accent",
      "decoration-dashed underline-offset-4 hover:underline",
      "focus-visible:no-underline focus-visible:underline-offset-0",
    ]}
  >
    <Heading
      style={{ viewTransitionName: slugifyStr(title.replaceAll(".", "-")) }}
    >
      {title}
    </Heading>
  </a>
  <div class="flex items-center gap-2">
    <Datetime {...props} />
    {
      sourceLabel && (
        <span class="flex items-center gap-1 rounded border border-accent/30 px-1.5 py-0.5 text-xs font-medium text-accent/70">
          {source === "substack" && (
            <IconSubstack class="size-3" />
          )}
          {sourceLabel}
        </span>
      )
    }
  </div>
  <p>{description}</p>
</li>
```

**Step 3: Dev server check**

```bash
pnpm run dev
```

Visit `/posts/` and verify Substack posts show the orange "S" mark before "Substack" in the badge. WordPress posts show text-only badge. Check on mobile.

**Step 4: Build check**

```bash
pnpm run build 2>&1 | tail -10
```

**Step 5: Commit**

```bash
git add src/assets/icons/IconSubstack.svg src/components/Card.astro
git commit -m "feat: add Substack logo to source badge on post cards"
```

---

## Task 6: Race Schedule Page (Issue #7)

**Priority: Medium**

Create `/race-schedule` as a static Astro page with her full race history (2011–2018) from the original WordPress site.

**Files:**
- Create: `src/pages/race-schedule.astro`
- Modify: `src/components/Header.astro`

**Step 1: Fetch and review the source page**

```bash
curl -s "http://www.ameliabooneracing.com/raceschedule.html" | python3 -m html.parser 2>/dev/null || curl -s "http://www.ameliabooneracing.com/raceschedule.html"
```

Or use the WebFetch tool to read the page. Review all content carefully before writing the page.

**Step 2: Create the race schedule page**

Create `src/pages/race-schedule.astro`. Use `Layout.astro` directly (not `AboutLayout` — no profile photo needed):

```astro
---
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Footer from "@/components/Footer.astro";
import Breadcrumb from "@/components/Breadcrumb.astro";
---

<Layout title="Race History | Amelia Boone">
  <Header />
  <Breadcrumb />
  <main id="main-content" class="app-layout py-10">
    <h1 class="mb-2 text-3xl font-bold">Race History</h1>
    <p class="mb-8 text-sm opacity-60">
      Results from 2011–2018. I'm commitment-phobic, so this will change.
    </p>

    <!-- Year sections — anchor links -->
    <nav class="mb-8 flex flex-wrap gap-2 text-sm">
      {["2018","2017","2016","2015","2014","2013","2012","2011"].map(y => (
        <a href={`#${y}`} class="text-accent underline decoration-dashed underline-offset-4 hover:opacity-75">{y}</a>
      ))}
    </nav>

    <div class="app-prose max-w-app">
      <!-- Paste full content from source, converted to Astro/HTML -->
      <!-- Each year as <h2 id="2018">2018</h2> with race list below -->
    </div>
  </main>
  <Footer />
</Layout>
```

**Important content notes:**
- Preserve year anchors (`id="2018"`, `id="2017"`, etc.) for the jump nav
- 2016 entry includes the femur fracture — keep verbatim
- Keep her voice and humor ("I'm commitment-phobic")
- Format: year heading, then unordered list of: Race Name · Date · Placement

**Step 3: Add to navigation**

In `src/components/Header.astro`, add after the "About" nav item:

```astro
<li class="col-span-2">
  <a
    href="/race-schedule"
    class:list={{ "active-nav": isActive("/race-schedule") }}
  >
    Race History
  </a>
</li>
```

**Step 4: Build and visual check**

```bash
pnpm run build 2>&1 | tail -10
pnpm run preview
```

Visit `/race-schedule`. Check all year anchors work. Check nav item is active on the page.

**Step 5: Commit**

```bash
git add src/pages/race-schedule.astro src/components/Header.astro
git commit -m "feat: add Race History page from WordPress raceschedule.html"
```

---

## Task 7: Press / In The News Page (Issue #8)

**Priority: Medium**

Create `/press` with archived press links. Check each URL for liveness; replace dead links with archive.org equivalents.

**Files:**
- Create: `src/pages/press.astro`
- Modify: `src/components/Header.astro`

**Step 1: Fetch the source page and all links**

```bash
curl -s "http://www.ameliabooneracing.com/news.html"
```

Collect all external links from the page.

**Step 2: Check link liveness via Wayback Machine API**

For each URL, run:

```bash
curl -s "https://archive.org/wayback/available?url=ORIGINAL_URL" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('archived_snapshots',{}).get('closest',{}).get('url','NOT FOUND'))"
```

For high-priority links (Tim Ferriss, Farnam Street, etc.), try this first. For dead links with no archive, mark as `[link unavailable]` — keep the title.

**Step 3: Create press.astro**

```astro
---
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Footer from "@/components/Footer.astro";
import Breadcrumb from "@/components/Breadcrumb.astro";
---

<Layout title="Press | Amelia Boone">
  <Header />
  <Breadcrumb />
  <main id="main-content" class="app-layout py-10">
    <h1 class="mb-2 text-3xl font-bold">Press</h1>
    <p class="mb-8 text-sm opacity-60">
      Podcasts, articles, and appearances. Some older links have been replaced with
      archived versions.
    </p>
    <div class="app-prose max-w-app">
      <!-- Sections: Podcasts, Print/Online, Video -->
      <!-- Each entry: Title (linked), publication, year -->
      <!-- Dead links: "[link unavailable]" as plain text label -->
    </div>
  </main>
  <Footer />
</Layout>
```

**Step 4: Add to navigation**

In `src/components/Header.astro`, add after "Race History":

```astro
<li class="col-span-2">
  <a href="/press" class:list={{ "active-nav": isActive("/press") }}>
    Press
  </a>
</li>
```

**Step 5: Build and visual check**

```bash
pnpm run build 2>&1 | tail -10
```

Check all links on the page open correctly.

**Step 6: Commit**

```bash
git add src/pages/press.astro src/components/Header.astro
git commit -m "feat: add Press page from WordPress news.html, dead links replaced with archive.org"
```

---

## Task 8: SEO Redirects + Sponsorships Draft Page (Issue #9)

**Priority: Medium**

Add Netlify 301 redirects for old WP static pages. Create a draft sponsorships page outside `src/pages/`.

**Files:**
- Modify: `netlify.toml`
- Create: `src/drafts/sponsorships.astro`

**Step 1: Add redirects to netlify.toml**

Append to `netlify.toml`:

```toml
[[redirects]]
  from = "/raceschedule.html"
  to = "/race-schedule"
  status = 301
  force = true

[[redirects]]
  from = "/news.html"
  to = "/press"
  status = 301
  force = true

[[redirects]]
  from = "/aboutme.html"
  to = "/about"
  status = 301
  force = true

[[redirects]]
  from = "/support.html"
  to = "/"
  status = 301
  force = true
```

**Step 2: Fetch the sponsorships source page**

```bash
curl -s "http://www.ameliabooneracing.com/support.html"
```

Note any sponsor logos (external image URLs). Download them:

```bash
mkdir -p public/images/sponsors
# For each logo URL found:
curl -o "public/images/sponsors/FILENAME.ext" "LOGO_URL"
```

**Step 3: Create the draft sponsorships page**

```bash
mkdir -p src/drafts
```

Create `src/drafts/sponsorships.astro`:

```astro
---
// DRAFT — not currently published.
// To activate: move this file to src/pages/sponsorships.astro
// and update the /support.html redirect in netlify.toml to point to /sponsorships
// Open question: page title should be "Things I Love" (original) or "Sponsorships"?
// Defaulting to "Sponsorships" — confirm with Amelia before publishing.

import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Footer from "@/components/Footer.astro";
---

<Layout title="Sponsorships | Amelia Boone">
  <Header />
  <main id="main-content" class="app-layout py-10">
    <h1 class="mb-2 text-3xl font-bold">Things I Love</h1>
    <p class="mb-8 text-sm opacity-60">
      Partners, sponsors, and gear that got me to the finish line.
    </p>
    <div class="app-prose max-w-app">
      <!-- Full content from support.html, migrated here -->
      <!-- Sponsor logos from public/images/sponsors/ -->
    </div>
  </main>
  <Footer />
</Layout>
```

**Step 4: Build check** (drafts dir is ignored by Astro)

```bash
pnpm run build 2>&1 | tail -10
```

Verify the draft does NOT appear in the built site. Verify `/support.html` redirects work.

**Step 5: Commit**

```bash
git add netlify.toml src/drafts/sponsorships.astro public/images/sponsors/
git commit -m "feat: add SEO redirects for WP static pages, create sponsorships draft page

Redirects: /raceschedule.html → /race-schedule, /news.html → /press,
/aboutme.html → /about, /support.html → /
Sponsorships page in src/drafts/ (inactive). Move to src/pages/ to publish."
```

---

## Task 9: Footnote Audit + Fix (Issue #3)

**Priority: Medium**

Audit footnote rendering in WP and Substack posts. The HTML cleanup converted Substack footnotes to `[1]` plain text references without links. WP conversion may have similar issues. Fix or style consistently.

**Files:**
- Possibly modify: select `src/data/blog/*.md` files
- Possibly modify: `src/styles/global.css`

**Step 1: Audit footnote patterns**

```bash
# Find posts with footnote-like patterns
grep -rn "\[1\]\|\[2\]\|\[3\]\|\[\^" src/data/blog/*.md | head -20

# Check a specific Substack post known to have footnotes
grep -n "\[" src/data/blog/substack-i-said-id-be-done-with-this-by-40.md | head -20
```

**Step 2: Visual inspection**

```bash
pnpm run dev
```

Open a Substack post with footnotes on localhost:4321. Note how `[1]`, `[2]` etc. appear inline and at the bottom. Are they linked? Styled? Readable?

Open a WP post with footnotes.

**Step 3: Determine fix approach**

Two options:
- **A (preferred if simple):** Add a CSS rule to `src/styles/global.css` to style `[N]` references with a superscript appearance
- **B (if footnotes are broken/unlinked):** Convert `[N]` references to proper Markdown footnotes `[^N]` / `[^N]: text` in affected posts

For Option A, add to `src/styles/global.css`:

```css
/* Style inline footnote references like [1] */
.app-prose p > [data-footnote-ref] {
  font-size: 0.75em;
  vertical-align: super;
}
```

For inline `[N]` plain text in Markdown, they render as literal text — which is acceptable for now. Only add complex CSS if it's truly broken.

**Step 4: Build and verify**

```bash
pnpm run build 2>&1 | tail -10
```

**Step 5: Commit if changes made**

```bash
git add src/styles/global.css  # or affected .md files
git commit -m "fix: improve footnote rendering in WP and Substack posts"
```

If no changes needed (footnotes acceptable as-is), commit a note to CLAUDE.md instead:

```bash
# Add to CLAUDE.md under Current Status:
# Footnotes: Substack posts use [N] plain text references (acceptable). No further action needed.
git commit -m "docs: note footnote audit result in CLAUDE.md"
```

---

## Task 10: Substack Image Audit (Issue #2)

**Priority: Low — audit only, likely no changes**

Confirm Substack images are on `substackcdn.com` and rendering. Document the hotlink decision.

**Step 1: Check Substack image URLs**

```bash
grep -roh "https://[^)\"' ]*substackcdn[^)\"' ]*" src/data/blog/substack-*.md | head -10
grep -roh "https://[^)\"' ]*substackcdn[^)\"' ]*" src/data/blog/substack-*.md | wc -l
```

**Step 2: Visual check**

```bash
pnpm run dev
```

Open a Substack post with images (e.g., `substack-i-said-id-be-done-with-this-by-40`) and confirm images load.

**Step 3: Document the decision in CLAUDE.md**

Add to the Substack content section of `CLAUDE.md`:

```
**Substack images**: Hotlinked from substackcdn.com — do NOT download. URLs are stable
as long as her Substack account is active. Decision logged 2026-03-11.
```

**Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document Substack image hotlink decision in CLAUDE.md"
```

---

## Task 11: GitHub Editing Guide for Client (Issue #11)

**Priority: Medium**

Write a plain-English editing guide for Amelia. Non-developer audience. Cover: editing posts, adding posts, editing static pages.

**Files:**
- Create: `docs/editing-guide.md`

**Step 1: Write the guide**

Create `docs/editing-guide.md` with these sections:

```markdown
# How to Edit Your Site on GitHub

## Quick Links
- Your blog posts: [src/data/blog/](link)
- About page: [src/pages/about.md](link)
- GitHub repo: https://github.com/nightowlstudiollc/amelia-boone

## Editing an Existing Post

1. Go to your repo on GitHub
2. Navigate to `src/data/blog/`
3. Click the post file you want to edit (e.g., `substack-so-this-is-40.md`)
4. Click the pencil icon (✏️) in the top right
5. Make your changes in the text editor
6. Scroll down to "Commit changes"
7. Write a brief note about what you changed (e.g., "Fix typo in intro")
8. Click "Commit changes"
9. Your site will update automatically in 2–3 minutes

## Adding a New Blog Post

[Step-by-step with frontmatter template]

## Editing the About Page

[Similar steps pointing to src/pages/about.md]

## Adding a New Static Page (e.g., Sponsorships)

[Explain: copy about.md, rename, edit — or ask Andrew]
```

Keep the tone warm and non-technical. Use screenshots if helpful (describe where to add them).

**Step 2: Commit**

```bash
git add docs/editing-guide.md
git commit -m "docs: add client GitHub editing guide"
```

---

## Commit Grouping Strategy

These tasks are mostly independent. Suggested PR grouping:

| PR | Tasks | Rationale |
|----|-------|-----------|
| PR A | Task 1 (WP images) | Large diff, standalone |
| PR B | Tasks 2 + 4 + 5 | Homepage + UI polish, all `src/` changes |
| PR C | Task 3 (contact form) | Requires Netlify Forms config, standalone |
| PR D | Tasks 6 + 7 + 8 (pages + redirects) | New pages + nav changes together |
| PR E | Tasks 9 + 10 + 11 (audit/docs) | Low-risk, no UI changes |

---

## Manual Steps (Andrew Only — Cannot Be Automated)

After PR C (contact form) is deployed:
- Netlify dashboard → `amelia-boone-archive` → Forms → `contact` → Notifications → Add email notification → Amelia's email address

After domain migration (Issue #12 — separate coordination):
- Update `website` in `src/config.ts` with final domain
- Update Netlify custom domain settings

---

## Not In This Plan

- **Issue #12 (domain migration)**: Coordination task, no code. Andrew handles directly.
- **Substack refresh button add-on** and **Direct editing add-on**: Post-call scope items if she decides to purchase.
