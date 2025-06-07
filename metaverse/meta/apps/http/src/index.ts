import express from "express";
import { router } from "./routes/v1";
import client from "@repo/db/client";

const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());//to parse body
app.use("/api/v1",router);

app.listen(process.env.PORT || 3000) 