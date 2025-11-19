# TeleCompass 🧭

**AI-Powered Telehealth Policy Intelligence Platform**

TeleCompass is a comprehensive SaaS application that ingests state telehealth policy PDFs, extracts structured facts, and provides intelligent search, Q&A, comparison, and dashboard features for healthcare compliance professionals.

## Snapshots

**Landing Page:**

![alt text](image-7.png)

**Search Module:**

![alt text](image-5.png)

**QnA Module:**

![alt text](image-4.png)

![alt text](image-6.png)

**Comparison Module:**

![alt text](image-2.png)

**Dashboard Module:**

![alt text](image-8.png)


## 🚀 Features

### 1. **Policy Finder** (Hybrid Search)
- Semantic search across all state telehealth policies
- AI-powered relevance scoring
- Snippet previews with page citations
- Filter by state

### 2. **RAG Q&A with Citations**
- Ask natural language questions about telehealth policies
- GPT-4 powered answers with confidence scores
- Full source citations (document + page number)
- Suggested follow-up questions for low-confidence responses

### 3. **Policy Comparator**
- Side-by-side comparison of up to 3 states
- Compare across key categories:
  - Modalities (Live video, Store-and-Forward, RPM, Audio-only)
  - Consent requirements
  - In-person visit rules

## Developer Guide

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database
- Ollama installed locally
- Pinecone account (free Starter plan works with Serverless GCP regions)

### 2. Installation
```bash
git clone <repository>
cd TeleCompass
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` with your configuration (see `.env.example` for all options):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/telecompass"
OLLAMA_HOST="http://localhost:11434"
OLLAMA_EMBED_MODEL="nomic-embed-text:latest"
OLLAMA_CHAT_MODEL="mistral:7b-instruct-q4_K_M"
PINECONE_API_KEY="pcsk_your-key"
PINECONE_INDEX_NAME="telecompass"
PINECONE_CLOUD="gcp"           # or aws/azure depending on your plan
PINECONE_REGION="us-central1"  # use a region supported by your Pinecone project
ALLOW_INGEST="false"
ALLOW_UPLOAD="false"
NEXT_PUBLIC_ENABLE_UPLOAD="false"
```

### 4. Database Setup
```bash
npx prisma db push
npx prisma generate
```

### 5. Ollama Setup
```bash
# Install Ollama from https://ollama.ai
ollama serve  # Start Ollama server
```

### 6. Pinecone Setup
```bash
npm run pinecone:setup        # create the serverless index (defaults to gcp/us-central1)
npm run pinecone:migrate      # optional legacy command if JSON embeddings still exist
```

The Pinecone index now stores all semantic vectors (previously JSON in PostgreSQL). Make sure the cloud/region you configure is supported by your Pinecone project.

### 7. Database Schema
### Core Models
- **State**: US states/territories
- **Policy**: Uploaded policy documents
- **PolicyChunk**: Text chunks with embeddings for RAG
- **PolicyFact**: Extracted structured facts
- **Comparison**: Saved comparisons
- **QueryLog**: Analytics and usage tracking


## 🎯 Usage Guide

### 1. Ingest Policies
- Toggle uploads on by setting `ALLOW_UPLOAD="true"`, `ALLOW_INGEST="true"`, and `NEXT_PUBLIC_ENABLE_UPLOAD="true"` in `.env`, then restart `npm run dev`.
- Make sure `ollama serve` *and* the Pinecone index are reachable before you upload.
- Open the Dashboard tab and use the "Upload Policy PDF" card to select a telehealth policy PDF.
- After the success message, allow ~1 minute for background processing (embedding to Pinecone + fact extraction) before refreshing the dashboard.

### 2. Search Policies
- Navigate to "Search" tab
- Enter a query (e.g., "consent requirements for live video")
- View ranked results with snippets and citations

### 3. Ask Questions
- Navigate to "Q&A" tab
- Ask natural language questions
- Review AI-generated answers with confidence scores
- Check citations for verification

### 4. Compare States
- Navigate to "Compare" tab
- Select 2-3 states
- Click "Compare Policies"
- Review side-by-side comparison table

### 5. View Dashboard
- Navigate to "Dashboard" tab
- Monitor coverage statistics
- Identify compliance risks
- Track processing status
- Uploaded PDFs are saved under `storage/uploads/` (ignored by Git); rerun uploads anytime to refresh facts.

## 🧪 Development

### Run Prisma Studio (Database GUI)
```bash
npm run db:studio
```

### Build for Production
```bash
npm run build
npm start
```

> **Hint:** After migrating from PostgreSQL embeddings, run `node scripts/reembed-pinecone.js` once to regenerate vectors in Pinecone before starting production.

### Lint Code
```bash
npm run lint
```

### MVP 
- [x] PDF ingestion pipeline
- [x] Hybrid search with embeddings
- [x] RAG Q&A with citations
- [x] Multi-state comparison
- [x] Dashboard visualizations

### Future Enhancements
- [ ] User authentication (NextAuth.js)
- [ ] Saved searches and comparisons
- [ ] Semantic diff for policy updates
- [ ] Export to PDF/Excel
- [ ] Advanced filtering and faceted search
- [ ] API rate limiting and quotas
- [ ] Multi-tenant support
- [ ] Mobile responsive improvements
- [ ] Real-time collaboration features

### 🔄 Pinecone Maintenance Tips
- `npm run pinecone:setup` — initialize or verify the Pinecone index.
- `node scripts/reembed-pinecone.js` — regenerate embeddings for all policies (use after model changes or migrations).
- `npm run pinecone:migrate` — legacy script to copy JSON embeddings if the old column still exists.
- Check index stats:
  ```bash
  node -e "require('dotenv').config(); require('ts-node/register'); const { pineconeIndex } = require('./lib/pinecone'); (async () => console.log(await pineconeIndex.describeIndexStats()))();"
  ```


📝 License

Proprietary – All Rights Reserved


📧 Support

For technical support or feature requests, please open an issue in the repository.

Built for healthcare compliance professionals.

Developed by Aditya and Sanjana, with special thanks to the Center for Connected Health Policy (CCHP) — https://www.cchpca.org/
