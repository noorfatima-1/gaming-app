import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Game server is running" });
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Game server running on http://localhost:${PORT}`);
});
