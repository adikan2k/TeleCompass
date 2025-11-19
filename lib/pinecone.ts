import { Pinecone } from '@pinecone-database/pinecone';

type PineconeCloud = 'aws' | 'gcp' | 'azure';
const ALLOWED_CLOUDS: PineconeCloud[] = ['aws', 'gcp', 'azure'];

// Pinecone configuration
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'telecompass-policies';

const rawCloud = (process.env.PINECONE_CLOUD ?? 'gcp').toLowerCase();
const PINECONE_CLOUD: PineconeCloud = ALLOWED_CLOUDS.includes(rawCloud as PineconeCloud)
  ? (rawCloud as PineconeCloud)
  : 'gcp';

const PINECONE_REGION = process.env.PINECONE_REGION || 'us-central1';

if (!PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY environment variable is required');
}

// Initialize Pinecone client
export const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

// Get the index
export const pineconeIndex = pinecone.index(PINECONE_INDEX_NAME);

// Vector dimensions for nomic-embed-text
export const VECTOR_DIMENSIONS = 768;

// Pinecone metadata structure
export interface PineconeMetadata {
  policyId: string;
  stateId: string;
  stateName: string;
  policyTitle: string;
  pageNumber: number;
  chunkIndex: number;
  content: string; // Store content snippet for preview
  [key: string]: any; // Allow additional properties for Pinecone
}

// Initialize Pinecone index (run once during setup)
export async function initializePineconeIndex() {
  try {
    // Check if index exists
    const indexList = await pinecone.listIndexes();
    const indexExists = indexList.indexes?.some(index => index.name === PINECONE_INDEX_NAME);

    if (!indexExists) {
      console.log(`Creating Pinecone index: ${PINECONE_INDEX_NAME}`);
      await pinecone.createIndex({
        name: PINECONE_INDEX_NAME,
        dimension: VECTOR_DIMENSIONS,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: PINECONE_CLOUD,
            region: PINECONE_REGION,
          },
        }
      });
      
      // Wait for index to be ready
      console.log('Waiting for index to be ready...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // 60 seconds
    } else {
      console.log(`Pinecone index ${PINECONE_INDEX_NAME} already exists`);
    }

    // Describe index to verify it's ready
    const indexDescription = await pinecone.describeIndex(PINECONE_INDEX_NAME);
    console.log('Index status:', indexDescription.status?.ready);
    
    return indexDescription;
  } catch (error) {
    console.error('Error initializing Pinecone index:', error);
    throw error;
  }
}

// Upsert vectors to Pinecone
export async function upsertVectors(
  vectors: Array<{
    id: string;
    values: number[];
    metadata: PineconeMetadata;
  }>
) {
  try {
    await pineconeIndex.upsert(vectors);
    console.log(`Upserted ${vectors.length} vectors to Pinecone`);
    return { upsertedCount: vectors.length };
  } catch (error) {
    console.error('Error upserting vectors to Pinecone:', error);
    throw error;
  }
}

// Query vectors from Pinecone
export async function queryVectors(
  queryVector: number[],
  topK: number = 5,
  filter?: Record<string, any>
) {
  try {
    const result = await pineconeIndex.query({
      vector: queryVector,
      topK,
      includeMetadata: true,
      filter
    });
    
    return result.matches || [];
  } catch (error) {
    console.error('Error querying vectors from Pinecone:', error);
    throw error;
  }
}

// Delete vectors from Pinecone
export async function deleteVectors(vectorIds: string[]) {
  try {
    await pineconeIndex.deleteMany(vectorIds);
    console.log(`Deleted ${vectorIds.length} vectors from Pinecone`);
    return { deletedCount: vectorIds.length };
  } catch (error) {
    console.error('Error deleting vectors from Pinecone:', error);
    throw error;
  }
}

// Delete all vectors for a policy
export async function deletePolicyVectors(policyId: string) {
  try {
    // Create a dummy vector for filter-only query
    // We need to provide a vector but don't care about similarity for deletion
    const dummyVector = new Array(768).fill(0);
    
    // Query to find all vectors for this policy
    const queryResult = await pineconeIndex.query({
      vector: dummyVector,
      filter: { policyId },
      topK: 10000, // Get all matching vectors
      includeMetadata: false
    });
    
    if (queryResult.matches && queryResult.matches.length > 0) {
      const vectorIds = queryResult.matches.map(match => match.id);
      await pineconeIndex.deleteMany(vectorIds);
      console.log(`Deleted ${vectorIds.length} vectors for policy ${policyId} from Pinecone`);
    } else {
      console.log(`No vectors found for policy ${policyId} in Pinecone`);
    }
    
    return { deletedCount: queryResult.matches?.length || 0 };
  } catch (error) {
    console.error('Error deleting policy vectors from Pinecone:', error);
    throw error;
  }
}
