import { prisma } from "./dbService.js";

export async function getAllCryptos() {
    return await prisma.cryptos.findMany({
        orderBy: { id: "asc" }
    });
}
