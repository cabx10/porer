import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { authRouter } from "./auth";
import { listingsRouter } from "./listings";
import { appointmentsRouter } from "./appointments";
import { messagesRouter } from "./messages";
import path from "path";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || "http://localhost:5173" }
});

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRouter);
app.use("/api/listings", listingsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/messages", messagesRouter);

// Socket.io integration for real-time messaging
io.on("connection", (socket) => {
  socket.on("join", (userId: string) => {
    socket.join("user_" + userId);
  });
});

app.set("io", io); // To access io from routers

server.listen(Number(process.env.PORT) || 4000, () => console.log("API running on :4000"));