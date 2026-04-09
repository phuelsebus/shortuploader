import rateLimit from "express-rate-limit";

export const uploadRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "900000", 10),
  max: parseInt(process.env.RATE_LIMIT_MAX ?? "10", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many upload requests. Please try again later.",
  },
});
