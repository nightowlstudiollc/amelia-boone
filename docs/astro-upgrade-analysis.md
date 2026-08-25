# Astro 5 → 7 upgrade: risk / reward analysis

Written 2026-08-25 to support a later go/no-go decision on [#54](https://github.com/nightowlstudiollc/amelia-boone/issues/54).
No upgrade was attempted. Nothing in this document changes the site.

**Bottom line:** the security case for upgrading is much weaker than the raw
advisory count suggests — 8 of the 9 Astro advisories need a feature this site
does not use, and the 9th is a dev-server-on-Windows issue. The strongest
reasons to upgrade are staying on a supported line and clearing a config
`@ts-ignore`, not risk reduction. There is no urgency. The `sharp` advisory that
shared this issue was independent of Astro and is already fixed (see below --
it needed a pnpm override, not a direct bump).

---

## Current state

| | Version | Notes |
|---|---|---|
| astro | 5.18.2 | declared `^5.16.6`; latest is **7.2.7** |
| Node | 24.19.0 | already above astro 7's `>=22.12.0` floor |
| @astrojs/sitemap | 3.7.3 | still 3.x on astro 6 and 7 — no major bump |
| @astrojs/rss | 4.0.19 | still 4.x on astro 6 and 7 — no major bump |
| @astrojs/check | 0.9.10 | latest |
| adapter | **none** | `output` unset → static; Netlify serves `dist/` |
| sharp | 0.35.3 | pinned by a pnpm override; see the sharp section |

Site size: 30 `.astro` files, 19 `.ts` files, ~3,200 LOC, 102 posts, 122 built
pages, 109 generated OG images, 98 RSS items. Build takes ~40s.

**No adapter is installed.** This matters more than anything else in this
document. The failure that motivated [#48](https://github.com/nightowlstudiollc/amelia-boone/issues/48)
— projectinsomnia's astro 5→7 bump shipping an empty site — ran through an
adapter and the legacy content-collections API. Neither is present here.

---

## Reward: what the upgrade actually buys

### 1. Security — weaker than the count implies

Nine of the ten accepted advisories in `audit-baseline.md` are Astro-chain. Each
was checked against this codebase rather than counted:

| Advisory | Sev | Requires | Present here? |
|---|---|---|---|
| GHSA-2pvr-wf23-7pc7 | high | Server island encrypted params | **No** — 0 uses of `server:defer` |
| GHSA-8hv8-536x-4wqp | high | Spread attribute *names* from untrusted input | **No** — spreads carry component-authored props |
| GHSA-4g3v-8h47-v7g6 | moderate | Spread attr names in `renderHTMLElement` | **No** — same as above |
| GHSA-f48w-9m4c-m7f5 | moderate | Host header SSRF, prerendered error page fetch | **No** — static, no server fetch |
| GHSA-j687-52p2-xcff | moderate | Unescaped **named** slot | **No** — 0 uses of `<slot name=>` |
| GHSA-jrpj-wcv7-9fh9 | moderate | `define:vars` `</script>` sanitization | **No** — 0 uses of `define:vars` |
| GHSA-7pw4-f3q4-r2p2 | low | `transition:*` on **hydrated islands** | **No** — 0 `client:*` directives |
| GHSA-xr5h-phrj-8vxv | low | Unescaped View Transition animation props | **No** — no custom animation props |
| GHSA-g7r4-m6w7-qqqr | low | esbuild dev server **on Windows** | **No** — macOS/Linux only, dev-only |

The two that come closest are worth stating precisely rather than dismissing.
Both counts were taken against the tree on 2026-08-25 and will age -- re-derive
them before relying on this section:

```bash
grep -rn 'client:load\|client:visible\|client:idle\|client:only' src/  # must stay empty
grep -rn 'transition:name' src/
grep -rn 'server:defer\|define:vars\|<slot name=' src/              # must stay empty
```

- **`transition:name` is used** in 5 places (`Tag.astro`, `PostDetails.astro`,
  `Main.astro`, `search.astro`, the tag page). The advisory is scoped to
  hydrated islands; this site has **zero** `client:*` directives, so nothing
  hydrates. Values also come from post frontmatter, which the maintainer
  authors.
- **Spread props are used** (`Footer.astro`, `LinkButton.astro`, and several
  component call sites). The XSS vector is attacker-controlled attribute
  *names*; here the spreads carry props defined by the site's own components.

The one genuinely external content source is the Substack sync. It converts
remote HTML to Markdown at sync time (`htmlToMarkdown` in
`netlify/functions/sync-substack.mts`), and the only `set:html` in the codebase
renders `JSON.stringify(structuredData)` — not remote content.

**Read:** these are real vulnerabilities in Astro, and they are correctly
reported. They are not reachable in this deployment. Upgrading for security
alone is not justified; upgrading so that a *future* feature addition is not
silently exposed is a fair argument.

### 2. Supported-line maintenance — the real reason

Astro 5 will stop receiving fixes. Every month on 5.x widens the eventual jump,
and #48 documents exactly how that ends: dependencies drift until something
forces a bump, and it arrives as a multi-major jump against a stale tree. This
is the strongest argument, and it is about cost control, not risk.

### 3. Concrete cleanups

- The `@ts-ignore` in `astro.config.ts` around `plugins: [tailwindcss()]` —
  whose own comment says *"This will be fixed in Astro 6 with Vite 7 support"* —
  can be deleted. Verified: withastro/astro#14030 was closed by #14445,
  milestone v6.0.0.
- Two experimental flags become stable config, removing experimental-API
  exposure (see below).

### 4. Not a reward: performance

No benchmark was run and none is claimed. Do not upgrade expecting a faster
build.

---

## Risk: what could break

Ranked by actual exposure, not by how alarming the changelog entry sounds.

### HIGH — v7 only: Sätteri replaces remark/rehype as the default Markdown processor

This is the single largest risk in either release, and it is entirely in v7.

The site renders 102 Markdown posts through two remark plugins configured in
`astro.config.ts`:

```js
remarkPlugins: [remarkToc, [remarkCollapse, { test: "Table of contents" }]]
```

v7 swaps the Markdown engine underneath that, and `@astrojs/markdown-remark` is
no longer installed by default. Every post body, every heading anchor, and the
table-of-contents behaviour route through this path.

Aggravating factor specific to this repo: in-body footnotes use
`[N](#footnote-N)` linking to `<a id="footnote-N">` anchors, a convention
documented in CLAUDE.md and repaired by hand across 6 archived posts. Anchor
generation is exactly what a Markdown-processor swap perturbs.

**Mitigation:** diff rendered post HTML before and after, across all 102 posts —
not a spot check.

### MEDIUM — v7: stricter Rust-only compiler

The Go compiler is removed. Every non-void element needs a closing tag, and
invalid HTML is no longer auto-corrected. 30 `.astro` files is a small surface,
and `astro check` should surface violations at build time, but any malformed
markup that 5.x silently repaired will now fail.

### MEDIUM — v7: `compressHTML` default `true` → `'jsx'`

Changes whitespace handling in output. Unlikely to be visible on a prose site,
but it is a rendering-level default change and belongs in the visual diff.

### LOW — v6: content collections

Already on the modern Content Layer API (`glob()` from `astro/loaders` in
`src/content.config.ts`). v6 removes the **legacy** API, which this project does
not use. v7 adds only additive options.

This is the risk that the projectinsomnia outage was actually about, and it does
not apply here.

### LOW — v6: Zod 3 → Zod 4 *(tested)*

The collection schema uses `z.string().url()` for `originalUrl`, which is the
deprecated string-format family in Zod 4.

**Tested against zod 4.4.3:** `z.string().url()` still works — deprecated in
favour of `z.url()`, not removed. Astro 6 and 7 both depend on `zod ^4.3.6`.
The schema will not break. Optional tidy-up, not a blocker.

### LOW — v6: the two experimental flags *(tested)*

`experimental.fonts` and `experimental.preserveScriptOrder` both stabilize in
v6, so both must move or be deleted or the config is rejected.

**Tested against astro 6.4.8** by type-checking this project's exact font config:

- Moving both font families verbatim from `experimental.fonts` to a top-level
  `fonts` key **type-checks clean, zero errors**. The flat shape (`name`,
  `provider`, `cssVariable`, `weights`, `styles`, `fallbacks`) is preserved, and
  `fontProviders` still imports from `"astro/config"`.
- Leaving them under `experimental` is **rejected**, naming both keys.
- `preserveScriptOrder: true` becomes default behaviour — delete the line, no
  behaviour change.

This was the largest unknown going in. It is now a known mechanical edit.

Worth noting what the blast radius *would* be if fonts regressed: `<Font>` in
`Layout.astro` feeds `--font-inter` / `--font-lora`, which `global.css` maps to
`--font-app` (site body) and `--font-prose` (all post text). A regression would
be site-wide — but for the same reason, immediately obvious.

### LOW — v6: script/style source-order rendering

Now always source order. The project already sets `preserveScriptOrder: true`,
so current behaviour already matches. No change expected.

### LOW — image service changes

v6 changes cropping/upscaling defaults and SVG rasterization. There are **zero
local images** in `src/data` and no `<Image>`/`<Picture>` components — Substack
images are hotlinked per CLAUDE.md. Effectively no exposure.

### NOT A RISK — adapter and output mode

`output: 'static'` with no adapter is still supported in v7. All the invasive
v6 adapter-API removals (`RouteData.generate()`, `astro:ssr-manifest`, etc.)
apply to adapter authors. Not applicable.

### NOT A RISK — Node

astro 6 and 7 require `>=22.12.0`. This repo is pinned to Node 24 in `.nvmrc`,
`package.json` engines, `netlify.toml` and the CI matrix. Prerequisite already
met.

---

## The sharp advisory — DONE, and it needed an override

GHSA-f88m-g3jw-g9cj (high, libvips CVEs) was the tenth accepted advisory and had
**nothing to do with Astro**. Fixed on 2026-08-25; kept here because how it had
to be fixed is a trap worth recording.

**A direct bump of `sharp` does not fix it.** Astro declares
`optionalDependencies: { sharp: "^0.34.0" }`, and that is the copy Astro
actually loads. Changing this project's own `dependencies.sharp` to `^0.35.0`
installs a *second* copy that Astro ignores, leaving the vulnerable 0.34.5
resolved and in use. Nothing here imports `sharp` directly — the image pipeline
runs through Astro — so the direct dependency alone had no effect.

Symptoms of the trap, which look like success:

- `pnpm audit` totals do not move (high stayed at 3).
- The advisory path changes to `.>astro>sharp`, still reported.
- The build passes cleanly, because the build was never broken.

The fix is a **pnpm override**, which forces one resolution for every consumer:

```json
"pnpm": {
  "overrides": { "sharp": "^0.35.0" }
}
```

Verified after applying it: one `sharp@0.35.3` in the lockfile (0.34.5 appears
zero times), one libvips (1.3.2), Astro's own symlink points at 0.35.3, and
`require("sharp").versions` reports sharp 0.35.3 on libvips 8.18.3. The advisory
is gone and high dropped 3 → 2. All 564 build output files — including every one
of the 109 generated OG PNGs — are byte-for-byte identical to the pre-bump build.

**Generalizes to the astro upgrade itself:** when astro moves to 6 or 7, its
`optionalDependencies.sharp` range will move too. Re-check whether this override
is still needed, still correct, or now pinning `sharp` *below* what astro wants.
An override that outlives its reason becomes the next stale pin.

---

## Recommended sequencing

Do **not** jump 5 → 7 in one step. The two hops have very different risk
profiles, and combining them means a rendering diff cannot tell you which
release caused a regression.

### Step 0 — sharp — DONE 2026-08-25

Fixed via a pnpm override (a direct bump does not work — see above). Baseline
doc shrunk to 9 entries.

### Step 1 — astro 5 → 6 (low risk, mostly mechanical)

Three config edits, all verified:

1. Lift both font families from `experimental.fonts` to top-level `fonts`.
2. Delete `experimental.preserveScriptOrder` (now default).
3. Delete the `@ts-ignore` block around `plugins: [tailwindcss()]`.

Then confirm `@tailwindcss/vite` is happy on Vite 7 (astro 6 ships `vite ^7.3.1`).

Verify: full build, `astro check`, `verify-build-output.sh`, and a rendered-text
diff of the homepage and a sample of posts. Ship it, let it sit on production for
a while.

### Step 2 — astro 6 → 7 (the real work; separate PR, separate week)

This is where the Markdown-processor swap lands. Budget real time for it:

- Diff rendered HTML for **all 102 posts**, not a sample.
- Verify footnote anchors specifically (`#footnote-N` targets).
- Verify the table of contents still renders (`remarkToc` + `remarkCollapse`).
- Check `@tailwindcss/vite` against Vite 8, which astro 7 ships.
- Watch for compiler strictness errors from `astro check`.

---

## What is already in place to catch a bad upgrade

The guardrails from #48 are live and were verified working on PR #56:

- **`scripts/verify-build-output.sh`** — asserts post-page count, RSS item
  count, homepage links to individual posts, and the absence of Astro's
  `does not exist or is empty` collection warning. That warning is the exact
  signal that made the projectinsomnia outage invisible: an empty collection is
  a warning, not an error, so the build still exits 0.
- **`.github/workflows/verify-deploy-preview.yml`** — polls the Netlify status
  and runs `scripts/check-deploy-preview.sh` against the published preview:
  key routes, served RSS item count, a dereferenced individual post, and the
  `og:image` URL.
- **`scripts/check-audit-baseline.sh`** — fails CI on any advisory outside the
  accepted set, so the upgrade cannot quietly introduce a new one.

Floors sit below current counts (RSS ≥ 80 against 98 actual), so ordinary
editing does not trip them while a collapse still fails.

**Gap worth knowing:** none of these compare *rendered post content*. They prove
pages exist and resolve, not that Markdown still renders correctly. For Step 2
that gap is the whole risk, so the rendered-HTML diff has to be done by hand.

### Baseline to diff against (captured 2026-08-25, astro 5.18.2, Node 24)

| Metric | Value |
|---|---|
| pages built | 122 |
| HTML files in `dist/` | 122 |
| generated OG PNGs | 109 |
| RSS items | 98 |
| pagefind indexed pages | 98 |
| homepage rendered text | 362 words |
| homepage size | 37,466 bytes |
| build time | ~40s |

A cheap content check that caught a real question during the lockfile refresh:

```bash
python3 -c "
import re,html
h=open('dist/index.html').read()
h=re.sub(r'<(script|style)[^>]*>.*?</\1>','',h,flags=re.S)
print(' '.join(html.unescape(re.sub(r'<[^>]+>',' ',h)).split()))
" > after.txt
diff before.txt after.txt
```

Run it per-post for Step 2.

---

## Decision guide

**Upgrade when** any of these becomes true:

- A feature is wanted that needs hydration (`client:*`), server islands, or SSR
  — at that point the dormant advisories become live, and the security argument
  flips from weak to strong.
- Astro 5 stops getting fixes, or a genuinely reachable advisory lands on 5.x.
- A dependency the site needs drops astro 5 support.
- There is a quiet week. This is maintenance, and it is much cheaper done
  deliberately than under pressure.

**Do not upgrade** to clear the audit baseline count. The baseline exists so
that accepted advisories are recorded honestly rather than chased; nine entries
that are unreachable in this deployment are not a reason to touch a working
site.

**Never** run `pnpm audit fix --force` here. Per #48 it has proposed a major
*downgrade* of `@astrojs/netlify`, which is how the projectinsomnia outage
happened.

---

## Verification status of the claims above

Everything asserted here was checked in this repo or against the registry on
2026-08-25. Nothing is recalled from memory.

| Claim | How verified |
|---|---|
| latest astro is 7.2.7 | `npm view astro dist-tags` |
| astro 6/7 need Node >=22.12.0 | `npm view astro@6.0.0/@7.2.7 engines` |
| astro 6 and 7 both ship zod ^4.3.6 | `npm view astro@N dependencies.zod` |
| `z.string().url()` survives zod 4 | executed against zod 4.4.3 |
| fonts config is a pure key move | `tsc --noEmit` against astro 6.4.8, exit 0 |
| old `experimental` keys are rejected | same, error TS2353 naming both keys |
| sitemap/rss need no major bump | `npm view @astrojs/… version` |
| no adapter installed | `@astrojs/netlify` not in `node_modules` |
| 0 `client:*`, `server:defer`, `define:vars`, named slots | `grep -rn` over `src/` |
| a direct sharp bump does NOT fix the advisory | audit still reports it via `.>astro>sharp` |
| the override does fix it | one sharp in lock, astro symlink -> 0.35.3, libvips 8.18.3 |
| sharp 0.35.3 changes no output | all 564 dist files byte-identical; check falsified |
| #14030 fixed in v6 | closed by #14445, milestone v6.0.0 |
| build baseline numbers | measured from a clean build |

Two items in the v6/v7 breaking-change lists were **not** independently
verified and are reported as the upstream guides state them: the Sätteri
Markdown-processor swap in v7, and the Rust-only compiler strictness. Both are
v7 concerns and both are covered by the Step 2 rendering diff.
