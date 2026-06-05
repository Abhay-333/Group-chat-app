import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./socket/index.js";

dotenv.config();

const port = Number(process.env.PORT) || 8001;
const server = http.createServer(app);

connectDB();
initSocket(server);

const startServer = (nextPort, attemptsLeft = 10) => {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
      console.warn(`Port ${nextPort} is busy. Trying ${nextPort + 1}...`);
      startServer(nextPort + 1, attemptsLeft - 1);
      return;
    }

    throw error;
  });

  server.listen(nextPort, () => {
    console.log(`Server running on port ${nextPort}`);
  });
};

startServer(port);
