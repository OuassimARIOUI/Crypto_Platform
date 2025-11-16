import {PrismaClient} from "@prisma/client";
import { logInfo, logError } from "../utils/logger.js";

export const prisma = new PrismaClient();



export async function connectDB() {

    try {
        await prisma.$connect();
        logInfo("Connexion prisma + PostgreSQL établie !");
        return prisma;
    } catch (err) {
        logError(" Erreur de connexion prisma  :", err.message);
        return null;
    }
}

