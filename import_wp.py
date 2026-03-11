#!/usr/bin/env python3
"""Import all WordPress posts from ameliabooneracing.com/blog/ into src/data/blog/"""

import json
import os
import re
import ssl
import urllib.request
from html import unescape

import html2text

# Category ID → tag mapping
CATEGORY_MAP = {
    1: "essays",         # uncategorized
    4: "racing",         # worldstoughestmudder
    5: "racing",         # deathrace
    6: "recovery",       # rehab
    7: "racing",         # spartan
    8: "ultrarunning",   # ultramarathons
    10: "essays",        # sport
    13: "essays",        # mental-health
}

# Tag ID → tag mapping
TAG_MAP = {
    11: "racing",        # race-report
    12: "ultrarunning",  # ultrarunning
    14: "essays",        # eating-disorder-recovery
    15: "essays",        # running
    16: "recovery",      # stress-fracture
    17: "recovery",      # injury
    18: "essays",        # grief
}

# Set up HTML→Markdown converter
h = html2text.HTML2Text()
h.ignore_links = False
h.body_width = 0
h.ignore_images = False

# SSL context that skips verification (self-signed cert on the WP site)
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, context=ctx) as resp:
        return json.loads(resp.read().decode("utf-8"))


def html_to_md(html):
    md = h.handle(html)
    # Strip WP shortcodes
    md = re.sub(r'\[caption[^\]]*\].*?\[/caption\]', '', md, flags=re.DOTALL)
    md = re.sub(r'\[gallery[^\]]*\]', '', md)
    md = re.sub(r'\[embed\].*?\[/embed\]', '', md, flags=re.DOTALL)
    md = re.sub(r'\[/?[a-z_]+[^\]]*\]', '', md)  # catch-all for remaining shortcodes
    # Fix common WP entities
    md = md.replace('&nbsp;', ' ').replace('<!--more-->', '')
    md = re.sub(r'\n{3,}', '\n\n', md)
    return md.strip()


def strip_html(html):
    """Strip HTML tags and return plain text."""
    text = re.sub(r'<[^>]+>', '', html)
    text = unescape(text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def resolve_tags(category_ids, tag_ids):
    """Map category and tag IDs to our simplified tag set."""
    tags = set()
    for cid in category_ids:
        if cid in CATEGORY_MAP:
            tags.add(CATEGORY_MAP[cid])
    for tid in tag_ids:
        if tid in TAG_MAP:
            tags.add(TAG_MAP[tid])
    if not tags:
        tags.add("racing")
    return sorted(tags)


def write_wp_post(slug, title, pubDatetime, description, body, originalUrl, tags):
    path = f"src/data/blog/{slug}.md"
    if os.path.exists(path):
        print(f"  SKIP (exists): {slug}")
        return False

    t = title.replace('"', '\\"').replace('\n', ' ').strip()
    d = description[:148].replace('"', '\\"').replace('\n', ' ').strip()
    tags_yaml = "\n".join(f"  - {tag}" for tag in tags)

    content = f"""---
title: "{t}"
pubDatetime: {pubDatetime}
description: "{d}"
source: wordpress
originalUrl: "{originalUrl}"
tags:
{tags_yaml}
draft: false
featured: false
---

{body}
"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  WROTE: {path}")
    return True


def main():
    base = "https://www.ameliabooneracing.com/blog/wp-json/wp/v2"
    page = 1
    total_written = 0
    total_skipped = 0

    while True:
        url = f"{base}/posts?per_page=100&page={page}&_fields=id,date,title,content,slug,categories,tags,excerpt,link"
        print(f"\nFetching page {page}...")
        try:
            posts = fetch(url)
        except Exception as e:
            print(f"Error or end: {e}")
            break

        if not posts:
            print("Empty response — done.")
            break

        for post in posts:
            slug = post["slug"]
            title = unescape(post["title"]["rendered"])

            # Date: WP date is like "2023-09-10T12:35:48" — append Z
            raw_date = post["date"]
            if "T" in raw_date:
                pubDatetime = raw_date + "Z"
            else:
                pubDatetime = raw_date + "T12:00:00Z"

            # Description from excerpt
            excerpt_html = post.get("excerpt", {}).get("rendered", "")
            description = strip_html(excerpt_html)[:148].strip()
            if not description:
                # Fall back to first 148 chars of body
                body_text = strip_html(post.get("content", {}).get("rendered", ""))
                description = body_text[:148].strip()

            # Body: convert HTML → Markdown
            body_html = post.get("content", {}).get("rendered", "")
            body = html_to_md(body_html)

            originalUrl = post.get("link", "")

            # Tags from categories + tags
            cat_ids = post.get("categories", [])
            tag_ids = post.get("tags", [])
            tags = resolve_tags(cat_ids, tag_ids)

            written = write_wp_post(slug, title, pubDatetime, description, body, originalUrl, tags)
            if written:
                total_written += 1
            else:
                total_skipped += 1

        page += 1

    print(f"\nDone! Wrote: {total_written}, Skipped (already existed): {total_skipped}")


if __name__ == "__main__":
    main()
