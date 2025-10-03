import express from "express";
import { router } from "./routes/v1";
import client from "@repo/db";

const cors = require('cors');
const app = express();
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-vercel-app.vercel.app', // Replace with your actual Vercel URL
    process.env.FRONTEND_URL // Add this to your backend env vars
  ],
  credentials: true
}));
app.use(express.json());//to parse body
app.use("/api/v1",router);

app.listen(process.env.PORT || 3000) 