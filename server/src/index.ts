import express from "express";
import cors from "cors";
import { authRouter } from "./auth";
import { listingsRouter } from "./listings";
import { appointmentsRouter } from "./appointments";

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/listings", listingsRouter);
app.use("/api/appointments", appointmentsRouter);

app.listen(Number(process.env.PORT) || 4000, () => console.log("API running on :4000"));
