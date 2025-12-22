import express from "express";
import cors from "cors";
import cryptosRouter from "./routes/cryptos.routes.js";
import pricesRouter from "./routes/prices.routes.js";
import alertsRoutes from "./routes/alerts.routes.js";
import indicatorsRoutes from "./routes/indicators.routes.js";
import authRoutes from "./routes/auth.routes.js";
import portfolioRoutes from "./routes/portfolio.routes.js";
import discordRoutes from "./routes/discord.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import messagesRoutes from "./routes/messages.routes.js";
import realtimeRoutes from "./routes/realtime.routes.js";
import { maintenanceGuard } from "./middleware/maintenance.js";

const app = express();


app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}));


app.use(express.json());

// Global maintenance mode (admin can bypass)
app.use(maintenanceGuard);

// Tes routes
app.use("/cryptos", cryptosRouter);
app.use("/prices", pricesRouter);
app.use("/alerts", alertsRoutes);
app.use("/indicators", indicatorsRoutes);
app.use("/auth", authRoutes);
app.use("/portfolio", portfolioRoutes);
app.use("/discord", discordRoutes);
app.use("/admin", adminRoutes);
app.use("/reports", reportsRoutes);
app.use("/messages", messagesRoutes);
app.use("/realtime", realtimeRoutes);

export default app;
