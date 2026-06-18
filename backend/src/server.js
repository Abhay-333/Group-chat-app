import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./socket/index.js";

dotenv.config();

const port = Number(process.env.PORT) || 3000;
const server = http.createServer(app);

// Server initiallization
const startServer = async () => {

  try {
    // DB connection
    await connectDB();

    // Socket connection
    initSocket(server);

    // Server is Listening at port
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

  }
  catch (err) {
    console.error(err);
    process.exit(1);
  }
};

startServer();

