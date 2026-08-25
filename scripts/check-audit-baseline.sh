#!/usr/bin/env bash
# Compare `pnpm audit` against the accepted advisory set in
# docs/audit-baseline.md.
#
# Fails when a NEW advisory appears -- one not recorded as accepted. Reports,
# without failing, when an accepted advisory has become fixable, so the
# acceptance list does not quietly rot.
#
# The point is to keep the acceptance honest rather than to chase a number:
# a count-based threshold passes just as happily when an accepted advisory is
# replaced by a brand-new critical one.
#
# Usage: check-audit-baseline.sh [path-to-baseline-doc]

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASELINE_DOC="${1:-${REPO_ROOT}/docs/audit-baseline.md}"

if [[ ! -f "${BASELINE_DOC}" ]]; then
  printf 'FAIL: baseline doc not found at %s\n' "${BASELINE_DOC}" >&2
  exit 1
fi

# Accepted set: every GHSA id mentioned in the doc. Parsing the ids out of the
# prose keeps one list rather than a doc plus a machine-readable copy that
# drift apart.
accepted="$(grep -oE 'GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}' "${BASELINE_DOC}" \
  | sort -u || true)"

if [[ -z "${accepted}" ]]; then
  printf 'FAIL: no GHSA ids found in %s -- is the doc formatted correctly?\n' \
    "${BASELINE_DOC}" >&2
  exit 1
fi

# `pnpm audit` exits non-zero whenever advisories exist, which is the normal
# state here, so its status carries no signal -- the comparison below does.
audit_json="$(pnpm audit --json 2>/dev/null || true)"

if [[ -z "${audit_json}" ]] || ! printf '%s' "${audit_json}" | jq -e . >/dev/null 2>&1; then
  printf 'FAIL: pnpm audit produced no parseable JSON\n' >&2
  exit 1
fi

current="$(printf '%s' "${audit_json}" \
  | jq -r '.advisories // {} | to_entries[] | .value.github_advisory_id' \
  | sort -u || true)"

# Cross-check the advisory list against the independent metadata counter. If a
# future pnpm renames or restructures .advisories, the extraction above yields
# nothing and every comparison below trivially passes -- the script would
# report "no advisories outside the baseline" precisely when it had stopped
# being able to see any. Reading a second field that must agree turns that
# silent pass into a loud failure.
reported_total="$(printf '%s' "${audit_json}" \
  | jq -r '[.metadata.vulnerabilities // {} | to_entries[] | .value] | add // 0')"
extracted_total="$(printf '%s\n' "${current}" | grep -c . || true)"

if [[ "${reported_total}" -gt 0 && "${extracted_total}" -eq 0 ]]; then
  printf 'FAIL: pnpm audit reports %s vulnerabilities but no advisory ids could\n' \
    "${reported_total}" >&2
  printf 'be parsed from .advisories. The audit JSON schema has probably changed;\n' >&2
  printf 'this script cannot see advisories any more and must be updated.\n' >&2
  exit 1
fi

# New = present in the audit, absent from the doc. These fail the build.
new_advisories="$(comm -13 <(printf '%s\n' "${accepted}") <(printf '%s\n' "${current}") || true)"

# Stale = accepted in the doc, no longer reported. Informational only:
# usually means a bump fixed it and the doc should shrink.
stale_advisories="$(comm -23 <(printf '%s\n' "${accepted}") <(printf '%s\n' "${current}") || true)"

accepted_count="$(printf '%s\n' "${accepted}" | grep -c . || true)"
current_count="$(printf '%s\n' "${current}" | grep -c . || true)"

printf 'Accepted advisories: %s\n' "${accepted_count}"
printf 'Reported advisories: %s\n' "${current_count}"
printf '\n'

if [[ "${current_count}" -eq 0 ]]; then
  # Everything cleared. Listing all ten as individually removable is just
  # noise; say it once. Expected once the astro major upgrade lands.
  printf 'NOTE: no advisories reported at all -- the accepted set in %s is\n' \
    "$(basename "${BASELINE_DOC}")"
  printf 'now entirely stale and the whole list can be emptied.\n\n'
elif [[ -n "${stale_advisories}" ]]; then
  printf 'NOTE: accepted advisories no longer reported -- remove them from %s:\n' \
    "$(basename "${BASELINE_DOC}")"
  printf '%s\n' "${stale_advisories}" | sed 's/^/  - /'
  printf '\n'
fi

if [[ -n "${new_advisories}" ]]; then
  printf 'FAIL: advisories not in the accepted baseline:\n' >&2
  while read -r ghsa; do
    [[ -z "${ghsa}" ]] && continue
    detail="$(printf '%s' "${audit_json}" | jq -r --arg id "${ghsa}" '
      .advisories // {} | to_entries[]
      | select(.value.github_advisory_id == $id)
      | "\(.value.severity) \(.value.module_name) (patched \(.value.patched_versions))"
    ' | head -1)"
    printf '  - %s  %s\n' "${ghsa}" "${detail}" >&2
  done <<< "${new_advisories}"
  printf '\n' >&2
  printf 'Run pnpm update first -- most advisories clear with a lockfile refresh.\n' >&2
  printf 'If one is genuinely unfixable in place, add it to %s with the reason.\n' \
    "$(basename "${BASELINE_DOC}")" >&2
  exit 1
fi

printf 'No advisories outside the accepted baseline.\n'
