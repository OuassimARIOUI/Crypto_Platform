import dotenv from "dotenv";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../");
const envTestPath = resolve(backendRoot, ".env.test");

dotenv.config({ path: envTestPath, override: true });

if (!process.env.DATABASE_URL) {
  throw new Error(
    `Missing DATABASE_URL. Expected it in ${envTestPath} or environment variables.`
  );
}

// No force reset: user explicitly requested not to reset the database.
// This will create/update tables as needed on the test database.
const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

const push = spawnSync(
  npxCmd,
  ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"],
  {
  cwd: backendRoot,
  stdio: "inherit",
  env: process.env,
  }
);

if (push.status !== 0) {
  process.exit(push.status ?? 1);
}

// Ensure the generated Prisma Client matches schema.prisma.
const gen = spawnSync(npxCmd, ["prisma", "generate"], {
  cwd: backendRoot,
  stdio: "inherit",
  env: process.env,
});

process.exit(gen.status ?? 0);
