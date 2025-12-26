import { prisma } from "../../../services/dbService.js";

export async function truncateAllTables() {
  // Truncate all public tables to keep tests isolated.
  // Uses CASCADE to handle FK relationships.
  const tables = await prisma.$queryRaw`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  `;

  const names = (tables || [])
    .map((t) => t?.tablename)
    .filter((t) => t && t !== "_prisma_migrations");

  if (names.length === 0) return;

  const quoted = names.map((t) => `"${t.replaceAll('"', '""')}"`).join(", ");
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE;`
  );
}
