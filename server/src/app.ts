import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

export const app: express.Express = express();

// Set up a global middleware

export const setUpMiddleware = () => {
  app.use(express.json());
  app.use(cors());
  app.use(cookieParser());

  // Logging middleware, Config logger later
  app.use((req, _, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
  });
};
