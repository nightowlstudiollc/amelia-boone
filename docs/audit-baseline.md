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

## Accepted advisories

Last reviewed: 2026-08-25 (Node 24, astro 5.18.2)

Every entry below is blocked on a major upgrade tracked in **#54**. If that
issue is closed and entries remain here, one of the two is out of date.

### Blocked on the astro 5 -> 7 major upgrade

`package.json` declares `astro ^5.16.6`. Every advisory below is patched only
in astro 6.x or 7.x, which `^5` cannot reach.

| GHSA | Severity | Patched in |
|---|---|---|
| GHSA-2pvr-wf23-7pc7 | high | >=6.4.6 |
| GHSA-8hv8-536x-4wqp | high | >=6.3.3 |
| GHSA-4g3v-8h47-v7g6 | moderate | >=7.1.0 |
| GHSA-f48w-9m4c-m7f5 | moderate | >=7.0.6 |
| GHSA-j687-52p2-xcff | moderate | >=6.1.6 |
| GHSA-jrpj-wcv7-9fh9 | moderate | >=6.4.6 |
| GHSA-7pw4-f3q4-r2p2 | low | >=7.0.4 |
| GHSA-xr5h-phrj-8vxv | low | >=6.1.10 |

### Transitive, via astro

| GHSA | Severity | Package | Patched in |
|---|---|---|---|
| GHSA-g7r4-m6w7-qqqr | low | esbuild (astro > esbuild) | >=0.28.1 |

### Blocked on a sharp minor-major bump

`package.json` declares `sharp ^0.34.5`; the fix landed in 0.35.0. Also
tracked in #54.

| GHSA | Severity | Patched in |
|---|---|---|
| GHSA-f88m-g3jw-g9cj | high | >=0.35.0 |

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
