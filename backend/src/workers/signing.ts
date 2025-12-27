import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { SIGNING_QUEUE_NAME, SigningJobData } from "../queues/signing.js";
import { DidoxClient } from "../didox/didoxClient.js";
import { prisma } from "../prisma.js";

const didox = new DidoxClient();

export const signingWorker = new Worker(
  SIGNING_QUEUE_NAME,
  async (job: Job<SigningJobData>) => {
    const { documentId, didoxDocumentId, signature, companyToken } = job.data;

    console.log(`[worker] Processing document ${documentId} (Didox: ${didoxDocumentId}) for company ${job.data.companyId}`);

    try {
      // 1. Add Timestamp from Didox
      console.log(`[worker] Requesting timestamp for document ${documentId}...`);
      const { timeStampTokenB64 } = await didox.addTimestamp({
        pkcs7_64: signature,
        signature_hex: "", // Not used by Didox timestamp endpoint if pkcs7 is provided
      });

      // 2. Submit the signature to Didox
      console.log(`[worker] Submitting signature for document ${documentId}...`);
      const signRes = await didox.signDocument({
        documentId: didoxDocumentId,
        signature: timeStampTokenB64,
        userKey: companyToken,
      });

      if (!signRes.ok) {
        throw new Error(`Didox signing failed for document ${documentId}`);
      }

      // 2. Update database status
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "SIGNED" },
      });

      console.log(`[worker] Successfully signed document ${documentId}`);
      return { success: true };
    } catch (err: any) {
      console.error(`[worker] Error signing document ${documentId}:`, err);
      // Let BullMQ retry based on queue config
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process 5 documents in parallel
  }
);

signingWorker.on("failed", (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err);
});

signingWorker.on("completed", (job) => {
  console.log(`[worker] Job ${job.id} completed successfully`);
});

