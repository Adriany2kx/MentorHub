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

const streams = [{ stream: destination }] as Array<{ stream: any }>;

if (env.NODE_ENV === "development") {
  streams.push({
    stream: pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    }),
  });
}

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
