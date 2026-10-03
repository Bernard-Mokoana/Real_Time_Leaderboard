import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { logger } from "./utils/logger.js";
export const app = express();
// Set up a global middleware
export const setUpMiddleware = () => {
    app.use(express.json());
    app.use(cors());
    app.use(cookieParser());
    // Logging middleware, Config logger later
    app.use((req, _, next) => {
        logger.info(`Incoming request: ${req.method} ${req.path}`);
        next();
    });
};
//# sourceMappingURL=app.js.map