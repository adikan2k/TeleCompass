#!/usr/bin/env node

/**
 * Pinecone Setup Script
 * 
 * This script initializes the Pinecone index for TeleCompass
 * Run this once after setting up your Pinecone API key
 * 
 * Usage: node scripts/setup-pinecone.js
 */

require('ts-node/register');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { initializePineconeIndex } = require('../lib/pinecone');

async function setupPinecone() {
  console.log('🚀 Setting up Pinecone for TeleCompass...');
  
  try {
    // Initialize the Pinecone index
    const indexDescription = await initializePineconeIndex();
    
    console.log('✅ Pinecone setup completed successfully!');
    console.log('📊 Index Details:');
    console.log(`   - Name: ${indexDescription.name}`);
    console.log(`   - Dimensions: ${indexDescription.dimension}`);
    console.log(`   - Metric: ${indexDescription.metric}`);
    console.log(`   - Status: ${indexDescription.status?.ready ? 'Ready' : 'Not Ready'}`);
    
    console.log('\n🎯 Next steps:');
    console.log('1. Update your .env file with Pinecone credentials');
    console.log('2. Run: npm run build');
    console.log('3. Run: npm start');
    console.log('4. Upload your first policy PDF to test the system');
    
  } catch (error) {
    console.error('❌ Pinecone setup failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure PINECONE_API_KEY is set in your .env file');
    console.log('2. Check your Pinecone account has available index slots');
    console.log('3. Verify your internet connection');
    
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupPinecone();
}

module.exports = { setupPinecone };
