import express from "express";
import cryptosRouter from "./src/routes/cryptos.routes.js";
import pricesRouter from "./src/routes/prices.routes.js";
import alertsRoutes from "./src/routes/alerts.routes.js";
import indicatorsRoutes from "./src/routes/indicators.routes.js";
const app = express();
app.use(express.json());

// Montage de la route /cryptos
app.use("/cryptos", cryptosRouter);
app.use("/prices",pricesRouter);
app.use("/alerts", alertsRoutes);
app.use("/indicators", indicatorsRoutes);
export default app;
