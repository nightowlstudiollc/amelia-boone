#!/usr/bin/env bash
# Assert the build produced a real site, not just a zero exit status.
#
# Astro treats an unresolvable content collection as a WARNING, not an error:
#
#   The collection "blog" does not exist or is empty.
#
# The build still exits 0, and Netlify publishes whatever the build emits.
# That is how a sibling repo shipped a site with no posts and a 274-byte RSS
# feed behind a green CI run. This script turns that silent collapse into a
# failure.
#
# Usage: verify-build-output.sh [build-log-file]
#
# Exit 0 = output looks sane, exit 1 = it does not.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="${REPO_ROOT}/dist"
BUILD_LOG="${1:-}"

# Floors sit deliberately BELOW current counts so that ordinary editing --
# deleting or unpublishing a post -- does not fail CI as a false positive.
# They exist to catch a collapse (a near-total loss of content), not to
# pin an exact inventory. Current counts at time of writing: 102 source
# posts, 98 RSS items, 103 generated post pages.
MIN_RSS_ITEMS=80
MIN_POST_PAGES=80
MIN_HOME_POST_LINKS=3
MIN_INDEX_BYTES=5000

failures=0

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  failures=$((failures + 1))
}

pass() {
  printf 'ok: %s\n' "$1"
}

# --- The output directory itself ---

if [[ ! -d "${DIST}" ]]; then
  fail "dist/ does not exist -- the build produced no output at all"
  printf '\n%d check(s) failed.\n' "${failures}" >&2
  exit 1
fi
pass 'dist/ exists'

if [[ ! -f "${DIST}/index.html" ]]; then
  fail 'dist/index.html is missing -- the site has no homepage'
  printf '\n%d check(s) failed.\n' "${failures}" >&2
  exit 1
fi
pass 'dist/index.html exists'

# --- The homepage must be a real page, not an empty shell ---

index_bytes="$(wc -c < "${DIST}/index.html" | tr -d ' ')"
if (( index_bytes >= MIN_INDEX_BYTES )); then
  pass "dist/index.html is ${index_bytes} bytes"
else
  fail "dist/index.html is only ${index_bytes} bytes (expected >= ${MIN_INDEX_BYTES}; homepage looks empty)"
fi

# --- The most direct signal that a collection failed to resolve ---
#
# Checked only when a build log was supplied, so the script stays usable
# against an existing dist/ without one.

if [[ -n "${BUILD_LOG}" ]]; then
  if [[ ! -f "${BUILD_LOG}" ]]; then
    fail "build log '${BUILD_LOG}' was specified but does not exist"
  elif grep -qi "does not exist or is empty" "${BUILD_LOG}"; then
    fail 'build log contains "does not exist or is empty" -- a content collection failed to resolve'
  else
    pass 'build log has no empty-collection warning'
  fi
fi

# --- RSS feed ---
#
# NOTE: counted with grep -o piped to wc -l, NOT grep -c. The feed is
# minified onto a single line, so grep -c counts matching LINES and always
# returns 1 -- it would report "1 item" for both a healthy feed and a
# nearly empty one. Verified against this repo's real output: grep -c gives
# 1, the true count is 98.
#
# `|| true` is required because grep -o exits 1 when there are no matches,
# and under `set -e` with pipefail that would abort the script silently in
# precisely the zero-item case this check exists to catch.

if [[ ! -f "${DIST}/rss.xml" ]]; then
  fail 'dist/rss.xml is missing'
else
  rss_items="$(grep -o '<item>' "${DIST}/rss.xml" | wc -l | tr -d ' ' || true)"
  rss_items="${rss_items:-0}"

  if (( rss_items >= MIN_RSS_ITEMS )); then
    pass "dist/rss.xml contains ${rss_items} items"
  else
    fail "dist/rss.xml contains only ${rss_items} items (expected >= ${MIN_RSS_ITEMS}; the blog collection likely resolved empty)"
  fi
fi

# --- Generated post pages ---

if [[ ! -d "${DIST}/posts" ]]; then
  fail 'dist/posts/ is missing -- no post pages were generated'
else
  post_pages="$(find "${DIST}/posts" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ' || true)"
  post_pages="${post_pages:-0}"

  if (( post_pages >= MIN_POST_PAGES )); then
    pass "generated ${post_pages} post pages"
  else
    fail "generated only ${post_pages} post pages (expected >= ${MIN_POST_PAGES})"
  fi
fi

# --- The homepage must link to actual posts ---
#
# NOTE: a bare substring test for "/posts/" is NOT sufficient. The site nav
# links to the /posts/ index on every page, including when the post list is
# completely empty -- so that test passes on exactly the broken site this
# check is meant to catch. Individual post links (/posts/<slug>) are what
# actually prove content rendered.

home_post_links="$(grep -o 'href="/posts/[^"]\+"' "${DIST}/index.html" \
  | grep -v '^href="/posts/"$' \
  | sort -u | wc -l | tr -d ' ' || true)"
home_post_links="${home_post_links:-0}"

if (( home_post_links >= MIN_HOME_POST_LINKS )); then
  pass "homepage links to ${home_post_links} individual posts"
else
  fail "homepage links to only ${home_post_links} individual posts (expected >= ${MIN_HOME_POST_LINKS}; the nav's /posts/ link alone does not count)"
fi

printf '\n'
if (( failures > 0 )); then
  printf '%d check(s) failed.\n' "${failures}" >&2
  exit 1
fi

printf 'All build output checks passed.\n'
