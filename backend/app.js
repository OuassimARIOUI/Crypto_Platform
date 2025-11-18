import express from "express";
import cryptosRouter from "./src/routes/cryptos.routes.js";
import pricesRouter from "./src/routes/prices.routes.js";
const app = express();

app.use(express.json());

// Montage de la route /cryptos
app.use("/cryptos", cryptosRouter);
app.use("/prices",pricesRouter);

export default app;
