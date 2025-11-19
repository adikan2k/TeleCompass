import fs from "fs";
import path from "path";
import { prisma } from "./db";
import { processAndStorePDF, deletePolicyEmbeddings } from "./pdf-processor";
import { extractPolicyFacts } from "./rag";

interface IngestionJob {
  policyId: string;
  buffer?: Buffer;
  filePath?: string;
  deleteFileAfter?: boolean;
}

const jobQueue: IngestionJob[] = [];
let isProcessing = false;

export function queuePolicyProcessing(
  policyId: string,
  buffer?: Buffer | null,
  options: { filePath?: string; deleteFileAfter?: boolean } = {}
) {
  const job: IngestionJob = {
    policyId,
    buffer: buffer ?? undefined,
    filePath: options.filePath,
    deleteFileAfter: options.deleteFileAfter,
  };

  jobQueue.push(job);
  void processQueue();
}

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  while (jobQueue.length > 0) {
    const job = jobQueue.shift();
    if (!job) break;

    try {
      console.log(`🔄 Processing policy ${job.policyId}`);
      
      // Get policy details for Pinecone metadata
      const policy = await prisma.policy.findUnique({
        where: { id: job.policyId },
        include: { state: true }
      });
      
      if (!policy) {
        throw new Error(`Policy ${job.policyId} not found`);
      }

      const buffer = await resolveBuffer(job);

      console.log(`📄 Extracting text and generating embeddings...`);
      const processed = await processAndStorePDF(
        buffer,
        job.policyId,
        policy.stateId,
        policy.state.name,
        policy.title
      );
      console.log(`✅ ${processed.chunks.length} chunks processed and stored in Pinecone`);

      console.log(`💾 Writing chunks to PostgreSQL (without embeddings)...`);
      await prisma.policyChunk.createMany({
        data: processed.chunks.map((chunk) => ({
          policyId: job.policyId,
          content: chunk.content,
          pageNumber: chunk.pageNumber,
          chunkIndex: chunk.chunkIndex,
          // Note: embedding is now stored in Pinecone, not PostgreSQL
        })),
      });

      console.log(`🔍 Extracting structured facts...`);
      await extractPolicyFacts(job.policyId);

      await prisma.policy.update({
        where: { id: job.policyId },
        data: {
          status: "completed",
          processedAt: new Date(),
        },
      });

      console.log(`🎉 Policy ${job.policyId} processed successfully`);
    } catch (error) {
      console.error(`❌ Failed processing policy ${job?.policyId}:`, error);

      await prisma.policy.update({
        where: { id: job?.policyId },
        data: { status: "failed" },
      });
    } finally {
      if (job?.deleteFileAfter && job.filePath) {
        try {
          await fs.promises.unlink(job.filePath);
        } catch (unlinkError) {
          console.warn(`⚠️ Failed to delete temp file ${job.filePath}:`, unlinkError);
        }
      }
    }
  }

  isProcessing = false;
}

async function resolveBuffer(job: IngestionJob): Promise<Buffer> {
  if (job.buffer) {
    return job.buffer;
  }

  if (job.filePath) {
    return fs.promises.readFile(job.filePath);
  }

  throw new Error("No buffer or file path provided for ingestion job");
}

// Delete policy and its embeddings from both databases
export async function deletePolicy(policyId: string): Promise<void> {
  try {
    console.log(`🗑️ Deleting policy ${policyId} from PostgreSQL...`);
    
    // Delete from PostgreSQL
    await prisma.policy.delete({
      where: { id: policyId }
    });
    
    // Delete embeddings from Pinecone
    console.log(`🗑️ Deleting embeddings from Pinecone...`);
    await deletePolicyEmbeddings(policyId);
    
    console.log(`✅ Policy ${policyId} deleted successfully`);
  } catch (error) {
    console.error(`❌ Failed to delete policy ${policyId}:`, error);
    throw error;
  }
}
