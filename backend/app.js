import express from "express";
import cryptosRouter from "./src/routes/cryptos.routes.js";

const app = express();

app.use(express.json());

// Montage de la route /cryptos
app.use("/cryptos", cryptosRouter);

export default app;
