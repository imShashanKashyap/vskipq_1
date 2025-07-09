import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Set WebSocket constructor for Neon
neonConfig.webSocketConstructor = ws;

// Check if DATABASE_URL is set and export database connection
// This pattern allows both database and memory storage options to work
let pool: Pool | null = null;
let db: any = null;

try {
  if (process.env.DATABASE_URL) {
    console.log("Database URL found, initializing PostgreSQL connection");
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log("Database connection established successfully");
  } else {
    console.log("No DATABASE_URL found. Application will use in-memory storage instead.");
    // We'll fall back to in-memory storage in storage.ts
  }
} catch (error) {
  console.error("Failed to initialize database connection:", error);
  console.log("Falling back to in-memory storage");
}

export { pool, db };
