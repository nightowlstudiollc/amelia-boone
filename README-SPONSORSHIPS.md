# Sponsorships / "Things I Love" Page

This page exists as a draft and is ready to go when you have sponsorships or products you want to feature. It is **not visible on the site** until published.

---

## What It's For

A dedicated page — titled "Things I Love" — listing gear, food, supplements, or other products you actually use and believe in.

---

## How to Edit the Content

The draft lives at:
[`src/drafts/sponsorships.astro`](https://github.com/nightowlstudiollc/amelia-boone/blob/main/src/drafts/sponsorships.astro)

1. Click the file link above
2. Click the **pencil icon** (✏️) at the top right to edit
3. Find this section and replace "Content coming soon." with your actual content:

   ```html
   <div class="app-prose max-w-app">
     <p>
       <!-- Andrew: fill in sponsor/partner content here before publishing -->
       Content coming soon.
     </p>
   </div>
   ```

   You can write plain HTML here — paragraphs, links, headers, lists. For example:

   ```html
   <div class="app-prose max-w-app">
     <h2>Running Gear</h2>
     <p><a href="https://example.com">Brand Name</a> — one sentence on why you love it.</p>

     <h2>Nutrition</h2>
     <p><a href="https://example.com">Product Name</a> — what you use it for.</p>
   </div>
   ```

4. Commit when done — your changes are saved but the page still won't be live yet

---

## How to Publish It

Publishing requires two quick changes on Andrew's end:

1. Moving the file from `src/drafts/` into the live pages directory
2. Adding a link to it in the site navigation

When you're ready, just let Andrew know and he'll make it live within the day. Your content edits will already be saved and will appear as-is.
