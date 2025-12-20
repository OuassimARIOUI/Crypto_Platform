import express from "express";
import cors from "cors";
import cryptosRouter from "./routes/cryptos.routes.js";
import pricesRouter from "./routes/prices.routes.js";
import alertsRoutes from "./routes/alerts.routes.js";
import indicatorsRoutes from "./routes/indicators.routes.js";
import authRoutes from "./routes/auth.routes.js";
import portfolioRoutes from "./routes/portfolio.routes.js";
import discordRoutes from "./routes/discord.routes.js";

const app = express();


app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}));


app.use(express.json());

// Tes routes
app.use("/cryptos", cryptosRouter);
app.use("/prices", pricesRouter);
app.use("/alerts", alertsRoutes);
app.use("/indicators", indicatorsRoutes);
app.use("/auth", authRoutes);
app.use("/portfolio", portfolioRoutes);
app.use("/discord", discordRoutes);

export default app;
