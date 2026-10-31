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

Last reviewed: 2026-10-30 (Node 24, astro 7.3.8, zod 4.6.7, fast-uri 3.1.9)

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

### Held on minimatch 10 by @typescript-eslint/typescript-estree

| GHSA | Severity | Package | Patched in |
|---|---|---|---|
| GHSA-g3hv-75wg-m249 | moderate | minimatch (@typescript-eslint/parser > @typescript-eslint/typescript-estree > minimatch) | >=11.0.1 |

Added 2026-10-30: denial of service through glob-part amplification, where a
crafted pattern makes matching expensive.

- **Why it cannot be fixed in place.** The patch exists only on minimatch 11.
  `@typescript-eslint/typescript-estree@8.72.1`, the latest release, declares
  `minimatch: ^10.2.2`, so neither `pnpm update` nor a typescript-eslint
  upgrade reaches it. A pnpm override to 11 would force a major bump under the
  lint parser, and nothing here tests lint behavior beyond exit status.
- **Why it is not reachable.** minimatch runs only when ESLint runs, over the
  glob patterns in this repo's own config. It is a dev dependency: nothing in
  the built site or its deploy uses it, so no attacker-supplied pattern
  reaches it.

Remove this entry when typescript-estree moves to minimatch 11; the script
reports it as fixable when that happens.

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
