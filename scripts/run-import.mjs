import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/run-import.mjs <file.xlsx>");
  process.exit(1);
}

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
execSync(`npx tsx scripts/bench-import.ts "${file}"`, {
  cwd: root,
  stdio: "inherit",
  shell: true,
});
