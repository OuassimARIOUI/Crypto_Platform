import dotenv from "dotenv";
import { prisma } from "../services/dbService.js";

dotenv.config();

function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
        if (!token.startsWith("--")) continue;
        const key = token.slice(2);
        const value = argv[i + 1];
        args[key] = value;
        i += 1;
    }
    return args;
}

async function main() {
    const args = parseArgs(process.argv.slice(2));

    const email = args.email;
    const role = args.role;

    if (!email || !role) {
        console.error("Usage: node src/scripts/setUserRole.js --email user@email.com --role admin|moderator|user");
        process.exit(1);
    }

    if (!["admin", "moderator", "user"].includes(role)) {
        console.error("Invalid role. Allowed: admin, moderator, user");
        process.exit(1);
    }

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
        console.error(`User not found for email: ${email}`);
        process.exit(1);
    }

    const updated = await prisma.users.update({
        where: { id: user.id },
        data: { role },
    });

    console.log(JSON.stringify({
        success: true,
        id: updated.id,
        email: updated.email,
        pseudo: updated.pseudo,
        role: updated.role,
    }, null, 2));
}

main()
    .catch((err) => {
        console.error("Failed to set user role:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
