import express from "express";
import { router } from "./routes/v1";
import cors from "cors";
import client from "@repo/db";

const app = express();
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://2-d-metaverse-phi.vercel.app',// Replace with your actual Vercel URL
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
  ],
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use("/api/v1",router);

const server = app.listen(Number(process.env.PORT || 3000), () => {
  console.info(`HTTP API listening on ${process.env.PORT || 3000}`);
});

void client.$connect().then(
  () => console.info("HTTP API database connection established"),
  (error: unknown) => console.error("HTTP API could not reach PostgreSQL. Start Docker infrastructure and verify DATABASE_URL:", error instanceof Error ? error.message : "unknown error"),
);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => server.close());
}
