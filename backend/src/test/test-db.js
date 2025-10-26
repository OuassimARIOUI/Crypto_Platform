import dotenv from "dotenv";
import pkg from "pg";
dotenv.config();

const { Client } = pkg;

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function testConnection() {
    try {
        await client.connect();
        console.log(" Connexion PostgreSQL réussie !");
        const res = await client.query("SELECT * FROM public.alerts ORDER BY id ASC;");
        console.log(" Données récupérées :", res.rows);
    } catch (err) {
        console.error(" Erreur de connexion :", err.message);
    } finally {
        await client.end();
    }
}

testConnection();
