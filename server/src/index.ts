import { app, setUpMiddleware } from "./app";
import { startPool } from "./config/db";
import dotenv from "dotenv";

dotenv.config();

const startServer = async () => {
  const PORT = process.env.PORT || 8001;
  setUpMiddleware();

  await startPool();

  app.listen(PORT, async () => {
    console.log(`Listening to PORT: ${PORT}`);
  });
};

await startServer();
