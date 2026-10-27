import { mkdir, readFile, writeFile } from "node:fs/promises";
import { minify } from "terser";

const SOURCE = "enhanced-amazon-storefront.user.js";
const OUTPUT = "dist/enhanced-amazon-storefront.min.user.js";
const HEADER_END = "// ==/UserScript==\n";
// Only the full script lives on main, so minified installs update from the
// latest release asset instead.
const UPDATE_URL =
  "https://github.com/uvw/enhanced-amazon-storefront/releases/latest/download/enhanced-amazon-storefront.min.user.js";

const source = await readFile(SOURCE, "utf8");
const headerEnd = source.indexOf(HEADER_END);
if (headerEnd < 0) throw new Error(`${SOURCE} has no userscript header`);

let replaced = 0;
const header = source
  .slice(0, headerEnd + HEADER_END.length)
  .replace(/^(\/\/ @(?:updateURL|downloadURL)\s+).*$/gm, (_, key) => {
    replaced++;
    return key + UPDATE_URL;
  });
if (replaced !== 2) {
  throw new Error(`Expected @updateURL and @downloadURL, found ${replaced}`);
}

const { code } = await minify(source.slice(headerEnd + HEADER_END.length), {
  ecma: 2022,
  compress: { passes: 2 },
  format: { comments: false },
});

await mkdir("dist", { recursive: true });
await writeFile(OUTPUT, `${header}${code}\n`);
console.log(
  `${OUTPUT}: ${source.length} -> ${header.length + code.length + 1} bytes`,
);
