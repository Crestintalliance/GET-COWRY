// Copies square flag SVGs from country-flag-icons into public/flags so pages can load
// one small image per country (flag emoji don't display on Windows).
import { cpSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const pkg = dirname(require.resolve("country-flag-icons/package.json"));
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "flags");
mkdirSync(out, { recursive: true });
cpSync(join(pkg, "1x1"), out, { recursive: true });
console.log(`flags copied to ${out}`);
