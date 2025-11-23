import jwt from "jsonwebtoken";

export function auth(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: "Token manquant" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token invalide" });
    }
}


export function adminOnly(req, res, next) {
    if (req.user.role !== "admin")
        return res.status(403).json({ error: "Accès refusé" });

    next();
}

