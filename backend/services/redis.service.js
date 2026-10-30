
import "dotenv/config";
import Redis from "ioredis";

const host = process.env.REDIS_HOST?.trim();
const port = Number(process.env.REDIS_PORT);

if (
  !host ||
  !Number.isInteger(port) ||
  port < 1 ||
  port > 65535
) {
  throw new Error(
    `Invalid Redis configuration: host=${Boolean(host)}, port=${process.env.REDIS_PORT ?? "missing"}. Check backend/.env`
  );
}

const redis = new Redis({
  host,
  port,
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD || undefined,
  ...(process.env.REDIS_TLS === "true" ? { tls: {} } : {}),
  connectTimeout: 10000,
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => (times <= 3 ? 1000 : null),
});

redis.on("connect", () => {
  console.log("Redis TCP/TLS connection established");
});

redis.on("ready", () => {
  console.log("Redis is ready to accept commands");
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

export default redis;
