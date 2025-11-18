import {prisma} from "./dbService.js";

export async function getLatestPrices(){
    return prisma.crypto_prices.findMany({
        orderBy: {fetched_at: "desc"},
        take: 100
    });
}