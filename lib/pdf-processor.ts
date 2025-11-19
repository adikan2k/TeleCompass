import pdf from "pdf-parse";
import { generateEmbeddings } from "./openai";
import { upsertVectors, deletePolicyVectors, PineconeMetadata } from "./pinecone";
import { prisma } from "./db";

export interface PDFChunk {
  content: string;
  pageNumber: number;
  chunkIndex: number;
}

export interface ProcessedPDF {
  text: string;
  numPages: number;
  chunks: PDFChunk[];
}

const CHUNK_SIZE = 1000; // characters
const CHUNK_OVERLAP = 200; // characters

export async function processPDF(buffer: Buffer): Promise<ProcessedPDF> {
  try {
    const data = await pdf(buffer);
    
    const chunks = createChunks(data.text, data.numpages);
    
    return {
      text: data.text,
      numPages: data.numpages,
      chunks,
    };
  } catch (error) {
    console.error("Error processing PDF:", error);
    throw new Error("Failed to process PDF file");
  }
}

function createChunks(text: string, numPages: number): PDFChunk[] {
  const chunks: PDFChunk[] = [];
  let chunkIndex = 0;
  
  // Simple chunking strategy - split by size with overlap
  for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
    const chunk = text.slice(i, i + CHUNK_SIZE);
    
    // Estimate page number (rough approximation)
    const estimatedPage = Math.ceil((i / text.length) * numPages);
    
    chunks.push({
      content: chunk.trim(),
      pageNumber: estimatedPage,
      chunkIndex: chunkIndex++,
    });
  }
  
  return chunks;
}

export async function embedAndStoreChunks(
  chunks: PDFChunk[],
  policyId: string,
  stateId: string,
  stateName: string,
  policyTitle: string
): Promise<void> {
  try {
    console.log(`Generating embeddings for ${chunks.length} chunks...`);
    
    // Generate embeddings for all chunks
    const texts = chunks.map(chunk => chunk.content);
    const embeddings = await generateEmbeddings(texts);
    
    // Prepare vectors for Pinecone
    const vectors = chunks.map((chunk, i) => ({
      id: `${policyId}-chunk-${chunk.chunkIndex}`,
      values: embeddings[i],
      metadata: {
        policyId,
        stateId,
        stateName,
        policyTitle,
        pageNumber: chunk.pageNumber,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content.slice(0, 500), // Store first 500 chars for preview
      } as PineconeMetadata,
    }));
    
    // Upsert vectors to Pinecone
    console.log(`Storing ${vectors.length} vectors in Pinecone...`);
    await upsertVectors(vectors);
    
    console.log(`Successfully stored embeddings for policy ${policyId} in Pinecone`);
  } catch (error) {
    console.error("Error embedding and storing chunks:", error);
    throw new Error("Failed to embed and store chunks");
  }
}

// Delete all embeddings for a policy from Pinecone
export async function deletePolicyEmbeddings(policyId: string): Promise<void> {
  try {
    await deletePolicyVectors(policyId);
    console.log(`Successfully deleted embeddings for policy ${policyId} from Pinecone`);
  } catch (error) {
    console.error("Error deleting policy embeddings:", error);
    throw new Error("Failed to delete policy embeddings");
  }
}

// Process and store a complete PDF with embeddings
export async function processAndStorePDF(
  buffer: Buffer,
  policyId: string,
  stateId: string,
  stateName: string,
  policyTitle: string
): Promise<ProcessedPDF> {
  try {
    // Process PDF into chunks
    const processedPDF = await processPDF(buffer);
    
    // Generate embeddings and store in Pinecone
    await embedAndStoreChunks(
      processedPDF.chunks,
      policyId,
      stateId,
      stateName,
      policyTitle
    );
    
    return processedPDF;
  } catch (error) {
    console.error("Error processing and storing PDF:", error);
    throw new Error("Failed to process and store PDF");
  }
}

const STATE_ABBREVIATIONS: Record<string, string> = {
  "alabama": "AL",
  "alaska": "AK",
  "arizona": "AZ",
  "arkansas": "AR",
  "california": "CA",
  "colorado": "CO",
  "connecticut": "CT",
  "delaware": "DE",
  "district of columbia": "DC",
  "florida": "FL",
  "georgia": "GA",
  "hawaii": "HI",
  "idaho": "ID",
  "illinois": "IL",
  "indiana": "IN",
  "iowa": "IA",
  "kansas": "KS",
  "kentucky": "KY",
  "louisiana": "LA",
  "maine": "ME",
  "maryland": "MD",
  "massachusetts": "MA",
  "michigan": "MI",
  "minnesota": "MN",
  "mississippi": "MS",
  "missouri": "MO",
  "montana": "MT",
  "nebraska": "NE",
  "nevada": "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  "ohio": "OH",
  "oklahoma": "OK",
  "oregon": "OR",
  "pennsylvania": "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  "tennessee": "TN",
  "texas": "TX",
  "utah": "UT",
  "vermont": "VT",
  "virginia": "VA",
  "washington": "WA",
  "west virginia": "WV",
  "wisconsin": "WI",
  "wyoming": "WY",
  "puerto rico": "PR",
  "virgin islands": "VI",
  "guam": "GU",
  "american samoa": "AS",
  "northern mariana islands": "MP",
  "unknown": "UN",
};

export function extractStateName(fileName: string): string {
  // Extract state name from "CCHP Alabama Telehealth Laws Report, 07-18-2025.pdf"
  const match = fileName.match(/CCHP\s+(.+?)\s+Telehealth/i);
  return match ? match[1] : "Unknown";
}

export function getStateAbbreviation(stateName: string): string {
  const normalized = stateName.trim().toLowerCase();
  if (!normalized) return "UN";
  return (
    STATE_ABBREVIATIONS[normalized] ||
    normalized
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 3) ||
    "UN"
  );
}
