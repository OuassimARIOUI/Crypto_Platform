import { spawnSync } from "node:child_process";
import path from "node:path";

const mode = process.argv[2];
const known = new Set(["smoke", "load", "stress", "spike", "soak"]);
if (!mode) {
  console.error("Usage: node perf/k6/run.js <smoke|load|stress|spike|soak>");
  process.exit(2);
}

const baseUrl = process.env.BASE_URL || "http://host.docker.internal:3004";

const scriptsDir = path.resolve(process.cwd(), "perf", "k6");
const scriptFile = known.has(mode) ? `${mode}.js` : mode;

const dockerArgs = [
  "run",
  "--rm",
  "-i",
  "-e",
  `BASE_URL=${baseUrl}`,
];

if (mode === "load") {
  dockerArgs.push("-e", `MAX_VUS=${process.env.MAX_VUS || 20}`);
}

// Bind-mount scripts folder into the container.
// - Works in WSL: /mnt/c/... paths
// - Works in Windows PowerShell: C:\... paths
dockerArgs.push("-v", `${scriptsDir}:/scripts`);

dockerArgs.push("grafana/k6", "run", `/scripts/${scriptFile}`);

const result = spawnSync("docker", dockerArgs, {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
