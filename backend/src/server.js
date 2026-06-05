import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./socket/index.js";

dotenv.config();

const port = Number(process.env.PORT) || 3000;
const server = http.createServer(app);

connectDB();
initSocket(server);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
