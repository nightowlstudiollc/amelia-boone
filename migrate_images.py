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

# Match both http and https, both .com and .info variants, with or without www
IMG_PATTERN = re.compile(
    r'(https?://(?:www\.)?ameliabooneracing\.(?:com|info)/(?:blog/)?wp-content/uploads/([^)\]"\'> \n]+))'
)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

failed = []
downloaded = 0
skipped = 0
rewritten_files = 0

for md_file in sorted(Path("src/data/blog").glob("*.md")):
    content = md_file.read_text(encoding="utf-8")

    # Split frontmatter from body to avoid rewriting originalUrl
    # Frontmatter is between the first two --- lines
    parts = content.split("---", 2)
    if len(parts) >= 3:
        frontmatter = "---" + parts[1] + "---"
        body = parts[2]
    else:
        frontmatter = ""
        body = content

    matches = IMG_PATTERN.findall(body)
    if not matches:
        continue

    new_body = body
    for url, rel_path in matches:
        rel_path = rel_path.rstrip(".,;)")
        local_path = Path("public/images/wp") / rel_path
        local_ref = f"/images/wp/{rel_path}"

        # Try .info first, then fall back to .com/blog/
        url_clean = f"http://ameliabooneracing.info/wp-content/uploads/{rel_path}"
        url_fallback = f"http://www.ameliabooneracing.com/blog/wp-content/uploads/{rel_path}"

        local_path.parent.mkdir(parents=True, exist_ok=True)

        if not local_path.exists():
            success = False
            for try_url in [url_clean, url_fallback]:
                try:
                    req = urllib.request.Request(
                        try_url,
                        headers={"User-Agent": "Mozilla/5.0"}
                    )
                    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
                        local_path.write_bytes(resp.read())
                    print(f"  DL ({try_url.split('/')[2]}): {rel_path}")
                    downloaded += 1
                    success = True
                    break
                except Exception as e:
                    last_err = (try_url, str(e))
            if not success:
                print(f"FAIL: {last_err[0]} — {last_err[1]}")
                failed.append(last_err)
                continue
        else:
            skipped += 1

        new_body = new_body.replace(url, local_ref)

    if new_body != body:
        new_content = frontmatter + new_body
        md_file.write_text(new_content, encoding="utf-8")
        rewritten_files += 1
        print(f"Rewrote: {md_file.name}")

print(f"\nDone. Downloaded: {downloaded}, Skipped (cached): {skipped}, Files rewritten: {rewritten_files}")
if failed:
    print(f"\nFailed ({len(failed)}):")
    for url, err in failed:
        print(f"  {url} — {err}")
