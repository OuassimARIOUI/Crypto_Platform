import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Seed minimal data for perf tests (safe to run multiple times).
// Uses DATABASE_URL from backend/.env by default.

dotenv.config({ path: "./.env", override: false });

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL (expected backend/.env or environment variables)");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  // Ensure a crypto exists
  const crypto = await prisma.cryptos.upsert({
    where: { symbol: "btc" },
    update: { name: "Bitcoin" },
    create: { symbol: "btc", name: "Bitcoin" },
  });

  // Ensure at least one price exists
  const latest = await prisma.crypto_prices.findFirst({
    where: { crypto_id: crypto.id },
    orderBy: { fetched_at: "desc" },
  });

  if (!latest) {
    await prisma.crypto_prices.create({
      data: {
        crypto_id: crypto.id,
        price_usd: "42000.00",
        change_percent_24h: "0.10",
        fetched_at: new Date(),
      },
    });
  }

  console.log("Perf seed ok:", { crypto: crypto.symbol, hasPrice: Boolean(latest) });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
