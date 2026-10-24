// Copies MapLibre's web-worker bundle into /public so it is served from the
// app origin. Bundlers rewrite import.meta.url, which breaks MapLibre's default
// worker lookup; `setWorkerUrl("/maplibre-gl-worker.mjs")` points at this copy.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "node_modules", "maplibre-gl", "dist");
const out = join(root, "public");
mkdirSync(out, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  const src = join(dist, f);
  if (!existsSync(src)) continue;
  copyFileSync(src, join(out, f));
  console.log(`copied ${f} → public/`);
}
