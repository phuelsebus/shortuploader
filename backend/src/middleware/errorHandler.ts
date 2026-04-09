import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;
  logger.error({ message: err.message, stack: err.stack });
  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? "Internal server error" : err.message,
  });
}
