import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const SIGNING_QUEUE_NAME = "signing-queue";

export interface SigningJobData {
  documentId: string;
  signature: string; // The timeStampTokenB64 or pkcs7 signature from browser
  companyId: string;
  companyToken: string; // The temporary company-specific token from Didox
  accountantId: string;
  direction: "INCOMING" | "OUTGOING";
}

export const signingQueue = new Queue(SIGNING_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

