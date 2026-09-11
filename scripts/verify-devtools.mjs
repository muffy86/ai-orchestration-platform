#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const tools = [
  ["node", ["--version"], true],
  ["npm", ["--version"], true],
  ["codex", ["--version"], true],
  ["gemini", ["--version"], true],
  ["goose", ["--version"], false],
  ["aider", ["--version"], false],
  ["jctx", ["--version"], false],
  ["adb", ["version"], false],
  ["java", ["-version"], false],
];

const results = tools.map(([name, args, required]) => {
  const p = spawnSync(name, args, { encoding: "utf8", shell: process.platform === "win32" });
  const text = `${p.stdout ?? ""}\n${p.stderr ?? ""}`.trim().split("\n")[0] ?? "";
  return { name, required, ok: !p.error && p.status === 0, version: text };
});

console.table(results);
const missingRequired = results.filter((r) => r.required && !r.ok);
if (missingRequired.length) {
  console.error(`Required tools missing: ${missingRequired.map((r) => r.name).join(", ")}`);
  process.exit(1);
}
console.log("APEX devtool fabric baseline verified.");
