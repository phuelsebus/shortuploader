import "dotenv/config";
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "./utils/passport";
import uploadRouter from "./routes/upload";
import authRouter from "./routes/auth";
import statusRouter from "./routes/status";
import { errorHandler } from "./middleware/errorHandler";
import logger from "./utils/logger";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

app.set("trust proxy", 1);

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/upload", uploadRouter);
app.use("/auth", authRouter);
app.use("/api/status", statusRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Backend listening on http://localhost:${PORT}`);
});

export default app;
