import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

export default async function globalSetup() {
  // Load integration env (DATABASE_URL, JWT_SECRET) before any app/prisma imports.
  // Use a real filesystem path (dotenv doesn't reliably accept URL objects).
  const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../");
  dotenv.config({ path: resolve(backendRoot, ".env.test"), override: true });

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "Missing DATABASE_URL for integration tests. Set it in backend/.env.test or environment variables."
    );
  }

  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "test_jwt_secret";
  }
}
