#!/usr/bin/env node

/**
 * Migration script: Migrate embeddings from PostgreSQL to Pinecone
 * 
 * This script:
 * 1. Reads existing embeddings from PostgreSQL PolicyChunk table
 * 2. Migrates them to Pinecone vector database
 * 3. Removes the embedding column from PostgreSQL (optional)
 * 
 * Usage: node scripts/migrate-to-pinecone.js
 */

const { prisma } = require('../lib/db');
const { initializePineconeIndex, upsertVectors } = require('../lib/pinecone');
const { generateEmbedding } = require('../lib/openai');

async function migrateEmbeddings() {
  console.log('🚀 Starting migration from PostgreSQL to Pinecone...');
  
  try {
    // Initialize Pinecone
    console.log('📋 Initializing Pinecone index...');
    await initializePineconeIndex();
    
    // Get all policy chunks with embeddings
    console.log('📊 Fetching existing embeddings from PostgreSQL...');
    const chunksWithEmbeddings = await prisma.policyChunk.findMany({
      where: {
        embedding: {
          not: null
        }
      },
      include: {
        policy: {
          include: {
            state: true
          }
        }
      }
    });
    
    console.log(`Found ${chunksWithEmbeddings.length} chunks with embeddings to migrate`);
    
    if (chunksWithEmbeddings.length === 0) {
      console.log('✅ No embeddings found to migrate. Migration complete!');
      return;
    }
    
    // Process in batches to avoid overwhelming Pinecone
    const batchSize = 100;
    let processedCount = 0;
    
    for (let i = 0; i < chunksWithEmbeddings.length; i += batchSize) {
      const batch = chunksWithEmbeddings.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunksWithEmbeddings.length/batchSize)}...`);
      
      // Prepare vectors for Pinecone
      const vectors = batch.map(chunk => ({
        id: `${chunk.policyId}-chunk-${chunk.chunkIndex}`,
        values: chunk.embedding, // Already a number array
        metadata: {
          policyId: chunk.policyId,
          stateId: chunk.policy.stateId,
          stateName: chunk.policy.state.name,
          policyTitle: chunk.policy.title,
          pageNumber: chunk.pageNumber,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content.slice(0, 500), // Store first 500 chars for preview
        }
      }));
      
      // Upsert to Pinecone
      await upsertVectors(vectors);
      processedCount += batch.length;
      
      console.log(`✅ Migrated ${processedCount}/${chunksWithEmbeddings.length} embeddings`);
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log(`Total embeddings migrated: ${processedCount}`);
    
    // Ask if user wants to remove embedding column from PostgreSQL
    console.log('\n⚠️  Migration complete! Next steps:');
    console.log('1. Test the system to ensure everything works with Pinecone');
    console.log('2. Optionally remove the embedding column from PostgreSQL');
    console.log('   Run: npx prisma db push (after removing embedding column from schema)');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateEmbeddings();
}

module.exports = { migrateEmbeddings };
