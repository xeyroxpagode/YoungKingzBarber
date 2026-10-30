import { execSync } from "node:child_process";
import fs from "node:fs";

const steps = [
  { name: "typecheck", cmd: "pnpm typecheck" },
  { name: "build", cmd: "pnpm build" },
  { name: "unit", cmd: "pnpm test:unit" },
  { name: "integration", cmd: "pnpm test:integration" },
  { name: "e2e", cmd: "pnpm test:e2e" },
  { name: "backup", cmd: "pnpm backup:verify" },
];

const results = [];
for (const step of steps) {
  let status = "PASS";
  try {
    execSync(step.cmd, { stdio: "inherit", cwd: process.cwd() });
  } catch {
    status = "FAIL";
  }
  results.push({ name: step.name, status });
  fs.writeFileSync("docs/h01/FINAL_CERTIFICATION_RESULTS.json", JSON.stringify({ steps: results, generatedAt: new Date().toISOString() }, null, 2));
}

const allPass = results.every(r => r.status === "PASS");
console.log(allPass ? "H01 CERTIFY PASS" : "H01 CERTIFY FAIL");
process.exit(allPass ? 0 : 1);
