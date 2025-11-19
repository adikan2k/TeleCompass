# 🧭 TeleCompass Technical Demo Playbook

> Purpose: Equip a full-stack engineer (with limited AI/ML background) to understand, run, and confidently demonstrate TeleCompass end-to-end.

---

## 1. Executive Summary
TeleCompass is an AI-assisted policy intelligence platform. It ingests telehealth policy PDFs, converts them into structured knowledge, and exposes interactive tools (Search, Q&A, Comparison, Dashboard) so compliance teams can quickly navigate state-level regulations. The system now relies on **Pinecone** as its vector database, greatly improving semantic search and Retrieval-Augmented Generation (RAG) performance.

Key takeaways:
- **Frontend**: Next.js 14 (App Router) + Tailwind + Radix UI.
- **Backend**: Next.js API routes, Prisma ORM, PostgreSQL for relational data.
- **AI Services**: Ollama-hosted models (nomic-embed-text + mistral) + Pinecone vector store.
- **Core Value**: Rapid, citation-backed answers and comparisons drawn from thousands of policy chunks.

---

## 2. System Goals & User Benefits
| Goal | Description | User Benefit |
|------|-------------|--------------|
| Centralize telehealth policies | Upload, parse, and normalize PDFs for all states | Single source of truth |
| Search by meaning | Semantic vector search via Pinecone | Answers even when wording differs |
| Q&A with citations | Retrieval-Augmented Generation (RAG) pipeline | Trustworthy, traceable responses |
| Compare states | Structured facts per state | Rapid compliance assessments |
| Track activity | Query logs & dashboard | Measure coverage and usage |

---

## 3. Architecture Overview

```
           ┌──────────────────────────────────┐
           │            Frontend              │
           │ Next.js + Tailwind (App Router)  │
           └──────────────┬───────────────────┘
                          │
                  (API Calls over HTTPS)
                          │
┌─────────────────────────┴─────────────────────────┐
│                Backend / Serverless               │
│ Next.js API Routes                                │
│   ├── Upload / ingest endpoints                   │
│   ├── Search / Q&A / Compare endpoints            │
│   └── Analytics logging                           │
└───────┬────────────────┬────────────────┬─────────┘
        │                │                │
   ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
   │Postgres │      │ Pinecone│      │Ollama   │
   │(Prisma) │      │ Vector  │      │Models   │
   └─────────┘      │Store    │      └─────────┘
                    └─────────┘
```

- **PostgreSQL**: Stores structured metadata (states, policies, chunks, facts, logs).
- **Pinecone**: Stores 768-dimension embeddings + metadata for fast similarity search.
- **Ollama**: Runs local embedding model (`nomic-embed-text`) and chat model (`mistral`).

---

## 4. Data & Request Lifecycle

### 4.1 PDF Ingestion Pipeline
1. **Upload**: User submits PDF via Dashboard (feature gated by `.env` flags).
2. **Extraction**: `pdf-parse` pulls raw text.
3. **Chunking**: Text split into ~500-token segments for context-rich retrieval.
4. **Embedding**: Each chunk converted to 768-d vector via Ollama (`nomic-embed-text`).
5. **Upsert to Pinecone**: Vectors + metadata (policy ID, state, page number, snippet).
6. **Fact Extraction**: Structured facts saved to PostgreSQL.
7. **Status Update**: Policy marked processed; dashboard displays progress.

### 4.2 Search / Q&A Flow
1. User query → `hybridSearch` API.
2. Query embedded via Ollama.
3. Pinecone returns top-K similar chunks.
4. (Search) Display snippets + citations.
5. (Q&A) Pass retrieved chunks into `mistral` model → answer + citations.
6. Log query & result stats to PostgreSQL.

---

## 5. AI Concepts Explained Simply
| Concept | Plain-Language Analogy |
|---------|------------------------|
| **Embedding** | Turning a paragraph into a numerical “fingerprint” so similar ideas have similar fingerprints. |
| **Vector Database** | A specialized index (Pinecone) that can instantly find fingerprints closest to a query. |
| **RAG** | “Open-book AI.” First find the relevant pages (via embeddings), then have the model quote them when answering. |
| **Hybrid Search** | Combine semantic similarity + metadata filters (e.g., state). |

---

## 6. Environment & Configuration
1. Copy template: `cp .env.example .env`
2. Required variables:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/telecompass"
   OLLAMA_HOST="http://localhost:11434"
   OLLAMA_EMBED_MODEL="nomic-embed-text:latest"
   OLLAMA_CHAT_MODEL="mistral:7b-instruct-q4_K_M"
   PINECONE_API_KEY="pcsk_your-key"
   PINECONE_INDEX_NAME="telecompass"
   PINECONE_CLOUD="gcp"           # or aws/azure per your plan
   PINECONE_REGION="us-central1"  # must match Pinecone project support
   ALLOW_INGEST="false"
   ALLOW_UPLOAD="false"
   NEXT_PUBLIC_ENABLE_UPLOAD="false"
   ```
3. Run `npm install` (includes `@pinecone-database/pinecone`, `dotenv`, `ts-node`).

---

## 7. One-Time Setup Checklist
| Step | Command | Notes |
|------|---------|-------|
| Database schema | `npx prisma db push` | Creates tables without losing data. |
| Pinecone index | `npm run pinecone:setup` | Uses values from `.env` to create/verify index. |
| Models (Ollama) | `ollama pull nomic-embed-text:latest` & `ollama pull mistral:7b-instruct-q4_K_M` | Downloads once per machine. |
| (Optional) Backfill Pinecone | `node scripts/reembed-pinecone.js` | Re-embeds existing policies if migrating. |

---

## 8. Running the System
| Mode | What it does | Command |
|------|--------------|---------|
| Development | Hot reload, API routes | `npm run dev` |
| Production build | Compile app | `npm run build` |
| Production start | Serve optimized build | `npm start` |

Prerequisites:
- Ensure `ollama serve` is running in a separate terminal.
- Ensure Pinecone index exists and `.env` references correct cloud/region.

Health Checks:
- `node -e "require('dotenv').config(); require('ts-node/register'); const { pineconeIndex } = require('./lib/pinecone'); (async () => console.log(await pineconeIndex.describeIndexStats()))();"`
- `npm run db:studio` to inspect database contents.

---

## 9. Demo Flow (15–20 minutes)

### 9.1 Opening (1–2 min)
- Introduce TeleCompass and problem statement (manual compliance research is slow, inconsistent).

### 9.2 Architecture Walkthrough (3 min)
- Show this document’s architecture section.
- Emphasize separation: PostgreSQL (structured data) vs Pinecone (semantic vectors) vs Ollama (AI brains).

### 9.3 Live Product Demo (10 min)
1. **Dashboard Overview**
   - Show state coverage, processing status.
2. **Policy Upload (optional)**
   - Toggle `.env` ingestion flags to `true`, restart dev server, upload sample PDF.
   - Mention asynchronous processing and Pinecone upsert.
3. **Search Tab**
   - Query “consent requirements for live video”.
   - Highlight semantic results and citations.
4. **Q&A Tab**
   - Ask “Which states require an in-person visit before telehealth prescribing?”
   - Show answer, confidence, citations.
5. **Comparison Tab**
   - Compare three states; explain structured facts stored in PostgreSQL.

### 9.4 Technical Deep Dive (3 min)
- Explain ingestion pipeline step-by-step (Section 4.1).
- Describe how RAG queries interact with Pinecone (Section 4.2).

### 9.5 Closing & Q/A (2 min)
- Recap benefits: time savings, trustworthy answers, scalable architecture.
- Invite questions; reference troubleshooting section for possible errors.

---

## 10. Operations & Maintenance
| Task | Frequency | Command / Location |
|------|-----------|---------------------|
| Check Pinecone stats | Weekly | `describeIndexStats()` script above |
| Re-embed after model change | On demand | `node scripts/reembed-pinecone.js` |
| Monitor query activity | Monthly | `npm run db:studio` → `QueryLog`, `SearchHistory` |
| Backup database | Scheduled | Use managed Postgres backup strategy |
| Rotate API key | Quarterly | Update `.env`, rerun setup |

Troubleshooting Tips:
- **PineconeBadRequestError**: Region not supported → adjust `PINECONE_CLOUD/REGION`.
- **PINECONE_API_KEY missing**: Ensure `.env` is loaded (scripts call `dotenv`).
- **No search results**: Check `pineconeIndex.describeIndexStats()` for zero vectors; re-embed or ingest data.
- **500 errors on /api/search**: Confirm Ollama models pulled and `ollama serve` running.

---

## 11. Appendix

### 11.1 Key Scripts
| Script | Purpose |
|--------|---------|
| `scripts/setup-pinecone.js` | Creates Pinecone index (loads `.env`, registers ts-node). |
| `scripts/reembed-pinecone.js` | Iterates policies, regenerates embeddings, upserts to Pinecone. |
| `scripts/migrate-to-pinecone.js` | Legacy migration from JSON embeddings (no longer needed if column removed). |

### 11.2 Useful API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ingest` | POST (multipart) | Upload & queue a policy PDF. |
| `/api/search` | POST JSON `{ query, states?, topK? }` | Semantic search using Pinecone. |
| `/api/qa` | POST JSON `{ query, states?, topK? }` | RAG answer generation. |
| `/api/compare` | POST JSON `{ stateIds }` | Returns structured facts for comparison view. |

### 11.3 Glossary
- **Chunk**: ~500-token slice of policy text, enabling precise retrieval.
- **Metadata**: Key/value info stored alongside vectors (policyId, pageNumber, stateName).
- **Namespace** (Pinecone): Logical partition of vectors; TeleCompass currently uses the default namespace.
- **Hybrid Search**: Combining vector similarity with filters (e.g., restrict to specific states).

---

## 12. Suggested Q&A Prep
| Question | Suggested Talking Point |
|----------|-------------------------|
| Why Pinecone over PostgreSQL JSON? | Pinecone handles ANN search at scale; no need to manage custom vector indexes. |
| How secure is the data? | Runs within private infra; Ollama local models avoid external calls; PostgreSQL access controlled via env-configured credentials. |
| Can we swap models? | Yes—update `.env` model names, re-run `reembed-pinecone`, redeploy. |
| What happens if Pinecone is down? | Search/Q&A degrade gracefully (no results); ingestion still stores text/facts and can re-send embeddings when service returns. |

---

### Ready-to-Send Summary
This playbook is designed to be shared directly. It blends architectural clarity with practical steps so an engineer unfamiliar with AI can operate TeleCompass, explain its components, and deliver a confident demo.
