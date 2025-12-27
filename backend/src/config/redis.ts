import { Redis } from "ioredis";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

export const redisConnection = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

redisConnection.on("error", (err) => {
  console.error("[redis] Connection error:", err);
});

redisConnection.on("connect", () => {
  console.log("[redis] Connected to Redis server");
});

