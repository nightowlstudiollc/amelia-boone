# Site Editing Cookbook

Quick recipes for common edits. Everything happens on GitHub in your browser — no software to install.

**The pattern for every edit:** Find the file → click the pencil icon → make your change → commit → site updates in ~2 minutes.

---

## Fix a Typo or Rewrite Part of a Post

1. Go to [`src/data/blog/`](https://github.com/nightowlstudiollc/amelia-boone/tree/main/src/data/blog)
2. Find the file (use Ctrl+F / Cmd+F on the page to search by title if you're not sure of the filename)
3. Click the file, then click the **pencil icon** (✏️) at the top right
4. Make your edits — the actual post content starts after the second `---` line
5. Scroll down, write a short commit note (e.g., `Fix typo in opening paragraph`), click **"Commit changes"**

**Don't touch the block between the two `---` lines** (the frontmatter). That's metadata — title, date, tags. Leave it alone unless you know what you're changing.

---

## Add a New Post Manually

Use this when you want to publish something on the site that isn't coming from Substack — or if you need a post to appear immediately rather than waiting for the hourly sync.

1. Go to [`src/data/blog/`](https://github.com/nightowlstudiollc/amelia-boone/tree/main/src/data/blog)
2. Click **"Add file" → "Create new file"**
3. Name the file using lowercase letters and hyphens, ending with `.md`:
   - Good: `western-states-2026.md`
   - Not good: `Western States 2026.md`
4. Paste this template at the top and fill it in:

```
---
title: "Your Post Title Here"
pubDatetime: 2026-03-11T12:00:00Z
description: "One sentence summary, about 150 characters."
source: substack
originalUrl: "https://ameliaboone.substack.com/p/your-post-slug"
tags:
  - essays
draft: false
featured: false
---

Your post content here. Write in plain text or Markdown.
```

5. Write your post content below the second `---`
6. Commit when done

**Date format:** `2026-03-11T12:00:00Z` — year, month, day, then `T12:00:00Z`. Always include the time part.

**Source field:** Use `substack` for Substack posts, `wordpress` for old blog posts. If it's something brand new, use `substack`.

---

## Edit the About Page

1. Go to [`src/pages/about.md`](https://github.com/nightowlstudiollc/amelia-boone/blob/main/src/pages/about.md)
2. Click the pencil icon
3. Edit the text below the `---` block
4. Commit

---

## Change the Tags on a Post

Tags appear at the top of each post and in the tag index. To update them:

1. Open the post file in `src/data/blog/`
2. Click the pencil icon
3. Find the `tags:` section in the frontmatter (between the `---` lines):
   ```
   tags:
     - racing
     - injury
   ```
4. Add, remove, or edit the tags — one per line, starting with `  - `
5. Use lowercase and hyphens: `obstacle-racing` not `Obstacle Racing`
6. Commit

---

## Hide a Post Without Deleting It

If you want to take a post down temporarily:

1. Open the post file
2. Click the pencil icon
3. Find `draft: false` in the frontmatter and change it to `draft: true`
4. Commit

The post will disappear from the site but stays in the repo. Change it back to `draft: false` to restore it.

---

## Add a Link in a Post

In Markdown, links look like this:

```
[link text](https://example.com)
```

Example: `[my Substack](https://ameliaboone.substack.com)` renders as a clickable link.

---

## Add a Photo to a Post

For photos already hosted somewhere (Instagram, Substack, etc.), use a Markdown image:

```
![description of the photo](https://link-to-image.jpg)
```

For photos you want to upload directly, ask Andrew — image uploads require a bit more setup.

---

## What happens with Substack posts?

New posts you publish on Substack appear on the site automatically within about an hour. You don't need to do anything.

If you edit a Substack post after it's been published, the changes won't automatically sync. Let Andrew know and he can update it manually.

---

## What if something looks wrong?

Every change you make creates a record in the commit history. Nothing is permanent — anything can be undone. If something looks off after you commit, just let Andrew know and he can fix it.
