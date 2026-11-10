// Prints why `astro check` cannot load its packages, then exits 0.
//
// Since 2026-11-07, Netlify builds that restore the dependency cache fail
// with "The `@astrojs/check` and `typescript` packages are required".
// Astro catches the real resolve or import error and prints only that
// line (astro/dist/cli/install-package.js, getPackage). The same commit
// builds cleanly without the cache. This script repeats Astro's two steps
// (require.resolve from the project root, then import) and prints the
// error Astro hides. It never fails the build: the build itself decides.
// Remove it once the cause is found.
import { lstat, readlink } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const require = createRequire(path.join(root, "package.json"));
const packages = ["@astrojs/check", "typescript"];
const log = (line) => process.stdout.write(`${line}\n`);

log(`[diagnose-check-deps] node ${process.version}, root ${root}`);

for (const name of packages) {
  const link = path.join(root, "node_modules", name);
  try {
    const st = await lstat(link);
    const target = st.isSymbolicLink() ? await readlink(link) : "(not a symlink)";
    log(`[diagnose-check-deps] ${name}: node_modules entry -> ${target}`);
  } catch (err) {
    log(`[diagnose-check-deps] ${name}: no node_modules entry (${err.code})`);
  }

  let resolved;
  try {
    resolved = require.resolve(name, { paths: [root] });
    log(`[diagnose-check-deps] ${name}: resolves to ${resolved}`);
  } catch (err) {
    log(`[diagnose-check-deps] ${name}: RESOLVE FAILED ${err.code}: ${err.message}`);
    continue;
  }
  await tryImport(name, resolved);

  // pnpm keeps @astrojs/check's own dependencies out of the top level, so
  // resolve the language server from inside @astrojs/check.
  if (name === "@astrojs/check") {
    try {
      const inner = createRequire(resolved).resolve("@astrojs/language-server");
      log(`[diagnose-check-deps] @astrojs/language-server (via check): resolves to ${inner}`);
      await tryImport("@astrojs/language-server", inner);
    } catch (err) {
      log(`[diagnose-check-deps] @astrojs/language-server (via check): RESOLVE FAILED ${err.code}: ${err.message}`);
    }
  }
}

async function tryImport(name, resolved) {
  try {
    await import(pathToFileURL(resolved).href);
    log(`[diagnose-check-deps] ${name}: imports OK`);
  } catch (err) {
    log(`[diagnose-check-deps] ${name}: IMPORT FAILED ${err.code ?? ""}: ${err.message}`);
    log(String(err.stack).split("\n").slice(0, 12).join("\n"));
  }
}
