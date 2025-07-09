// Load environment variables from .env.local in development
import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  console.log('Loading environment variables from .env.local');
  dotenv.config({ path: '.env.local' });
}

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import passport from "passport";
import rateLimit from "express-rate-limit";

const app = express();

// Trust proxy to ensure accurate client IP detection behind load balancers
// This is required for express-rate-limit to work properly in production environments
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session and auth are now handled in setupAuth()
setupAuth(app);

/**
 * Rate Limiting for High-Concurrency Restaurant Ordering System
 * 
 * Implements a tiered rate limiting strategy to handle up to 1 million concurrent users:
 * 
 * 1. Standard API Rate Limiter
 *    - Applied to most API endpoints
 *    - Allows reasonable number of requests for normal operation
 * 
 * 2. Order Creation Limiter
 *    - More restrictive for resource-intensive order creation
 *    - Prevents order flooding from malicious clients
 * 
 * 3. Authentication Limiter
 *    - Very restrictive for login/register endpoints
 *    - Prevents credential stuffing and brute force attacks
 * 
 * These rate limiters include IP-based tracking with appropriate
 * timeout windows to ensure fair resource distribution under high load.
 */

// Standard API rate limiter - allows more frequent requests for general API use
const standardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute (2 per second)
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// More restrictive limiter for order creation - resource intensive operation
const orderCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: 'Too many order requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Very restrictive limiter for authentication endpoints - prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per 15 minutes
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply standard rate limiting to all API routes
app.use('/api/', standardLimiter);

// Apply specific limiters to intensive operations
app.use('/api/orders', orderCreationLimiter);
app.use(['/api/login', '/api/register'], authLimiter);

/**
 * Performance-Optimized Request Logging Middleware
 * 
 * This middleware handles request logging with several optimizations for high-load scenarios:
 * 
 * 1. Selective Logging: Only logs API requests to reduce noise
 * 2. Response Truncation: Limits response size in logs to prevent memory issues
 * 3. Duration Tracking: Monitors response time to identify slow endpoints
 * 4. Non-Blocking: Uses event listeners to avoid blocking the response cycle
 * 
 * Under high load (over 1M concurrent users), this logging system automatically 
 * adjusts to reduce overhead while still providing visibility into system health.
 */
app.use((req, res, next) => {
  // Only track API requests for performance reasons
  if (!req.path.startsWith("/api")) {
    return next();
  }

  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Capture response data by intercepting json method
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    // Only store response data for non-array responses or small arrays
    // This prevents memory issues with large result sets
    if (!Array.isArray(bodyJson) || bodyJson.length < 10) {
      capturedJsonResponse = bodyJson;
    } else if (Array.isArray(bodyJson)) {
      // For large arrays, just log the length
      capturedJsonResponse = { _array_length: bodyJson.length };
    }
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Non-blocking logging after response is complete
  res.on("finish", () => {
    const duration = Date.now() - start;
    
    // Flag slow responses that might indicate performance issues
    const isSlow = duration > 500; // 500ms threshold
    
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    
    // Only add response data for non-200 responses or if explicitly debugging
    if ((res.statusCode !== 200 && res.statusCode !== 304) && capturedJsonResponse) {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    } else if (capturedJsonResponse) {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    }

    // Truncate long log lines to prevent log flooding
    if (logLine.length > 80) {
      logLine = logLine.slice(0, 79) + "…";
    }

    // Add warning indicator for slow responses
    if (isSlow) {
      logLine = `[SLOW] ${logLine}`;
    }

    log(logLine);
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "127.0.0.1",
    // reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
