import fs from "node:fs";
import path from "node:path";
import pino from "pino";
import { env } from "../config/env.js";

const logsDir = path.resolve(process.cwd(), "logs");
const logFilePath = env.LOG_FILE_PATH || path.join(logsDir, "server.log");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const destination = pino.destination({
  dest: logFilePath,
  sync: false,
  mkdir: true,
});

const streams = [
  { stream: destination },
  { stream: process.stdout },
] as Array<{ stream: any }>;

export const logger = pino(
  {
    level: env.LOG_LEVEL,
    base: {
      service: "mentorhub-server",
      env: env.NODE_ENV,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.multistream(streams),
);
