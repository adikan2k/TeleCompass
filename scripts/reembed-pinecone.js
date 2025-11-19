#!/usr/bin/env node

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
  },
});
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { prisma } = require('../lib/db');
const { embedAndStoreChunks, deletePolicyEmbeddings } = require('../lib/pdf-processor');

async function reembedPolicies() {
  console.log('🧠 Re-embedding existing policies into Pinecone');
  console.log('===============================================' );

  try {
    const policies = await prisma.policy.findMany({
      include: {
        state: true,
      },
      orderBy: {
        uploadedAt: 'asc',
      },
    });

    if (policies.length === 0) {
      console.log('✅ No policies found in the database. Nothing to re-embed.');
      return;
    }

    console.log(`Found ${policies.length} policies to process\n`);

    for (const policy of policies) {
      console.log(`\n📄 Policy: ${policy.state?.name ?? 'Unknown State'} - ${policy.title}`);

      try {
        const chunks = await prisma.policyChunk.findMany({
          where: { policyId: policy.id },
          orderBy: { chunkIndex: 'asc' },
          select: {
            content: true,
            pageNumber: true,
            chunkIndex: true,
          },
        });

        if (chunks.length === 0) {
          console.log('⚠️  No chunks found for this policy. Skipping.');
          continue;
        }

        console.log(`   ↳ Found ${chunks.length} chunks. Deleting old embeddings (if any)...`);
        await deletePolicyEmbeddings(policy.id);

        console.log('   ↳ Generating embeddings and uploading to Pinecone...');
        await embedAndStoreChunks(
          chunks,
          policy.id,
          policy.stateId,
          policy.state?.name ?? 'Unknown',
          policy.title
        );

        console.log('   ✅ Re-embedded successfully.');
      } catch (policyError) {
        console.error(`   ❌ Failed to process policy ${policy.title}:`, policyError);
      }
    }

    console.log('\n🎉 Re-embedding process complete!');
  } catch (error) {
    console.error('❌ Unexpected error during re-embedding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reembedPolicies();
