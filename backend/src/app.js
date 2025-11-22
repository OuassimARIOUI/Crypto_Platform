import express from "express";
import cryptosRouter from "./routes/cryptos.routes.js";
import pricesRouter from "./routes/prices.routes.js";
import alertsRoutes from "./routes/alerts.routes.js";
import indicatorsRoutes from "./routes/indicators.routes.js";
import authRoutes from "./routes/auth.routes.js";
import portfolioRoutes from "./routes/portfolio.routes.js";

const app = express();
app.use(express.json());

// Montage de la route /cryptos
app.use("/cryptos", cryptosRouter);
app.use("/prices",pricesRouter);
app.use("/alerts", alertsRoutes);
app.use("/indicators", indicatorsRoutes);
app.use("/auth", authRoutes);
app.use("/portfolio", portfolioRoutes);

export default app;
