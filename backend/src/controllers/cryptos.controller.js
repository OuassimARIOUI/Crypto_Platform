import { getAllCryptos } from "../services/cryptosService.js";

export async function getAllCryptosController(req, res) {
    try {
        const cryptos = await getAllCryptos();
        return res.json(cryptos);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Erreur interne serveur" });
    }
}
