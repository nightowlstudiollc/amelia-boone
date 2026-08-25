#!/usr/bin/env bash
# Acceptance checks against the deploy Netlify actually published.
#
# scripts/verify-build-output.sh inspects dist/ on the CI runner. It cannot
# see the Netlify adapter, real HTTP routing, redirects, or anything that
# only fails once served. This exercises the live preview instead.
#
# Usage: check-deploy-preview.sh <preview-base-url>
#
# Exit 0 = the served site is sane, exit 1 = it is not.

set -euo pipefail

BASE_URL="${1:-}"

if [[ -z "${BASE_URL}" ]]; then
  printf 'usage: %s <preview-base-url>\n' "$(basename "$0")" >&2
  exit 2
fi

BASE_URL="${BASE_URL%/}"

# Kept in step with verify-build-output.sh: floors sit below current counts
# so ordinary editing does not fail CI.
MIN_RSS_ITEMS=80
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

fetch() {
  curl --silent --show-error --location \
    --max-time 30 --retry 2 --retry-delay 3 "${BASE_URL}$1"
}

http_status() {
  curl --silent --show-error --location \
    --max-time 30 --retry 2 --retry-delay 3 \
    --output /dev/null --write-out '%{http_code}' \
    "${BASE_URL}$1"
}

# --- Key routes must resolve ---

for path in / /posts /about /press /race-schedule /rss.xml; do
  status="$(http_status "${path}")"
  if [[ "${status}" == "200" ]]; then
    pass "${path} returned 200"
  else
    fail "${path} returned ${status} (expected 200)"
  fi
done

# --- Homepage, as served ---

home_html="$(fetch "/")"
home_bytes="${#home_html}"

if (( home_bytes >= MIN_INDEX_BYTES )); then
  pass "homepage body is ${home_bytes} bytes"
else
  fail "homepage body is only ${home_bytes} bytes (expected >= ${MIN_INDEX_BYTES})"
fi

# A bare "/posts/" substring is NOT sufficient: the nav links to the post
# index on every page, including when the post list is empty. Only
# individual /posts/<slug> links prove content actually rendered.
#
# `|| true` guards the zero-match case: grep -o exits 1 with no matches,
# which under set -e + pipefail would abort in exactly the broken case this
# check exists to catch.
home_post_links="$(printf '%s' "${home_html}" \
  | grep -o 'href="/posts/[^"]\+"' \
  | grep -v '^href="/posts/"$' \
  | sort -u | wc -l | tr -d ' ' || true)"
home_post_links="${home_post_links:-0}"

if (( home_post_links >= MIN_HOME_POST_LINKS )); then
  pass "homepage links to ${home_post_links} individual posts"
else
  fail "homepage links to only ${home_post_links} individual posts (expected >= ${MIN_HOME_POST_LINKS}; the nav's /posts/ link alone does not count)"
fi

# --- Served RSS must carry real items ---
#
# Counted with grep -o | wc -l rather than grep -c: the feed is minified
# onto one line, so grep -c counts lines and always returns 1.

rss_body="$(fetch "/rss.xml")"
rss_items="$(printf '%s' "${rss_body}" | grep -o '<item>' | wc -l | tr -d ' ' || true)"
rss_items="${rss_items:-0}"

if (( rss_items >= MIN_RSS_ITEMS )); then
  pass "served rss.xml contains ${rss_items} items"
else
  fail "served rss.xml contains only ${rss_items} items (expected >= ${MIN_RSS_ITEMS})"
fi

# --- An individual post must render, not just be linked ---

first_post_path="$(printf '%s' "${home_html}" \
  | grep -o 'href="/posts/[^"]\+"' \
  | grep -v '^href="/posts/"$' \
  | head -1 \
  | sed -n 's/^href="\([^"]*\)"$/\1/p' || true)"

if [[ -z "${first_post_path}" ]]; then
  fail 'could not find an individual post link to dereference'
else
  post_status="$(http_status "${first_post_path}")"
  if [[ "${post_status}" == "200" ]]; then
    pass "individual post ${first_post_path} returned 200"
  else
    fail "individual post ${first_post_path} returned ${post_status} (expected 200)"
  fi
fi

# NOTE: deliberately NOT implemented -- an apex-domain redirect check.
# Sending a "Host:" header for the production domain at a preview URL is
# answered by Netlify's platform-level domain routing rather than by this
# deploy, so an unrelated netlify.app site returns an identical 301. It
# would pass even against a deploy that does not exist. Netlify's own
# "Redirect rules" status already covers the [[redirects]] config. See
# issue #48.

printf '\n'
if (( failures > 0 )); then
  printf '%d check(s) failed.\n' "${failures}" >&2
  exit 1
fi

printf 'Deploy preview checks passed against %s\n' "${BASE_URL}"
