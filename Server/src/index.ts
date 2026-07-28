import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRouter from "./routes/authRouter.js";
import contentRouter from "./routes/contentRouter.js";
import shareRouter from "./routes/shareRouter.js";
import tagRouter from "./routes/tagRouter.js";
import { dbConnect } from "./utils/db.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/content", contentRouter);
app.use("/api/v1/brain", shareRouter);
app.use("/api/v1/tags", tagRouter);


dbConnect().then(() => {
  app.listen(PORT, () => {
    console.log(`Server started on PORT: ${PORT}`)
  })
});

