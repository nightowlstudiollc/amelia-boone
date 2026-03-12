# How to Edit Your Site on GitHub

This guide is for you, Amelia — no developer experience required. GitHub's built-in editor lets you make changes directly in your browser. Your site updates automatically within 2–3 minutes after you save.

---

## Quick Links

- **Your blog posts:** [`src/data/blog/`](https://github.com/nightowlstudiollc/amelia-boone/tree/main/src/data/blog)
- **About page:** [`src/pages/about.md`](https://github.com/nightowlstudiollc/amelia-boone/blob/main/src/pages/about.md)
- **GitHub repo home:** [nightowlstudiollc/amelia-boone](https://github.com/nightowlstudiollc/amelia-boone)

---

## Editing an Existing Post

1. Go to [`src/data/blog/`](https://github.com/nightowlstudiollc/amelia-boone/tree/main/src/data/blog) in your GitHub repo
2. Click the file you want to edit (e.g., `substack-so-this-is-40.md`)
3. Click the **pencil icon** (✏️) in the top right of the file view
4. Make your changes in the text editor
5. Scroll down to **"Commit changes"**
6. Write a short note about what you changed (e.g., `Fix typo in opening paragraph`)
7. Click **"Commit changes"**
8. Your site will update automatically in 2–3 minutes

**Tip:** The part between the `---` lines at the top of each file is metadata (title, date, etc.) — avoid editing that unless you're sure what you're changing. The actual post content starts after the second `---`.

---

## Adding a New Blog Post

1. Go to [`src/data/blog/`](https://github.com/nightowlstudiollc/amelia-boone/tree/main/src/data/blog)
2. Click **"Add file" → "Create new file"**
3. Name the file: use lowercase, hyphens instead of spaces, end with `.md`
   - Example: `my-new-post.md`
4. Paste this template at the top of the file and fill it in:

```
---
title: "Your Post Title Here"
pubDatetime: 2026-03-11T12:00:00Z
description: "One sentence summary of the post, about 150 characters."
source: substack
originalUrl: "https://ameliaboone.substack.com/p/your-post-slug"
tags:
  - essays
draft: false
featured: false
---

Your post content goes here, in Markdown.
```

5. Write your post below the second `---`
6. Scroll down, add a commit note, and click **"Commit changes"**

**Notes on the fields:**
- `pubDatetime`: Use ISO format — `YYYY-MM-DDTHH:MM:00Z`. The time is ignored for display but required.
- `source`: Use `substack` for Substack posts, `wordpress` for old WP posts
- `featured: true` makes the post appear in the "Worth Reading" section on the homepage. Keep this to 4–5 posts total.
- `draft: false` — always leave this as `false` to publish the post

---

## Editing the About Page

1. Go to [`src/pages/about.md`](https://github.com/nightowlstudiollc/amelia-boone/blob/main/src/pages/about.md)
2. Click the **pencil icon** (✏️)
3. Edit the content below the `---` block
4. Commit your changes

The About page uses simple Markdown — `**bold**`, `*italic*`, `[link text](URL)`, etc.

---

## Markdown Cheat Sheet

| What you want | What to type |
|---|---|
| **Bold** | `**bold text**` |
| *Italic* | `*italic text*` |
| [A link](https://example.com) | `[link text](https://example.com)` |
| Heading | `## Section Title` |
| List item | `- Item` |
| Line break | Leave a blank line between paragraphs |

---

## Things to Avoid

- **Don't edit files in `src/layouts/` or `src/components/`** — those control the site design. Let Andrew handle those.
- **Don't change the `---` frontmatter block** unless you know exactly what you're editing.
- **Don't delete the `draft: false` line** from posts — the post won't publish without it.

---

## When in Doubt

Contact Andrew at Night Owl Studio. Changes are always reversible — GitHub keeps a full history of every edit.
