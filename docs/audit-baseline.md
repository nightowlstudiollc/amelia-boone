# Audit baseline

`pnpm audit` reports advisories that have no fix available within the version
ranges this project declares. Rather than chase the number to zero or ignore
the command entirely, CI compares the current advisory set against the accepted
set recorded here and fails on anything outside it.

`scripts/check-audit-baseline.sh` enforces this. It fails when a **new** GHSA
appears, and reports (without failing) when an accepted one becomes fixable.

## How to read this

Each entry is a GHSA ID that is currently unfixable in place. "Unfixable in
place" means the patched version sits outside the semver range in
`package.json` — reaching it needs a deliberate major upgrade, not a lockfile
refresh.

Anything fixable by a lockfile refresh does **not** belong here. Run
`pnpm update` first; only what survives is a genuine acceptance.

The script treats **every** GHSA ID that appears anywhere in this file as
accepted, prose included. Do not name a resolved advisory here "for history";
that silently re-accepts it.

## Accepted advisories

Last reviewed: 2026-10-06 (Node 24, astro 7.3.6, sharp 0.35.5, fflate 0.7.5)

The astro 5 -> 7 upgrade (#54) cleared all eleven astro-chain entries that used
to be listed here, including the critical one. See
[astro-upgrade-analysis.md](astro-upgrade-analysis.md) for how that upgrade was
verified.

### Pinned exactly by @tailwindcss/typography

| GHSA | Severity | Package | Patched in |
|---|---|---|---|
| GHSA-rj75-hqrm-r3gf | moderate | postcss-selector-parser (@tailwindcss/typography > postcss-selector-parser) | >=7.1.6 |

Published 2026-10-05: quadratic-time parsing of flat selectors, which lets a
crafted selector exhaust CPU. It is unrelated to astro: main on astro 5 fails
the audit check on it too.

- **Why it cannot be fixed in place.** `@tailwindcss/typography@0.5.20` is the
  latest release and declares `postcss-selector-parser: 6.0.10` as an exact
  pin. The patch exists only on the 7.x line, so neither `pnpm update` nor a
  typography upgrade reaches it. A pnpm override to 7.x would force a major
  bump on the plugin's parser, and its effect would land in the generated CSS,
  which none of the build checks inspect.
- **Why it is not reachable.** The parser runs only at build time, inside the
  Tailwind plugin, over the selectors in this repo's own stylesheets
  (`src/styles/typography.css`). The site is statically built and deploys no
  code that parses selectors at request time, so no attacker-supplied input
  reaches it.

Remove this entry when typography ships a release on postcss-selector-parser
7.x; the script reports it as fixable when that happens.

## Two traps worth knowing (from issue #48)

- **Never run `pnpm audit fix --force` on this repo without reading the
  proposal.** npm's suggested "fix" for an Astro+Netlify tree has been a
  *major downgrade* of `@astrojs/netlify`, which would break the deploy.
- **Do not query the GitHub Advisory API by package name** to decide whether a
  fix exists. That returns every advisory ever filed against the package,
  including ones already patched in the installed version, and produces false
  "a fix now exists" reports. Scope to the GHSA IDs the current audit cites.

## Updating this file

1. `pnpm update` — refresh the lockfile first; most advisories die here.
2. `pnpm audit` — see what genuinely survives.
3. Add or remove GHSA entries, with the reason the fix is out of reach.
4. Update "Last reviewed".
