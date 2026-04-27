const fs = require('fs');
const path = require('path');

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    mA += vecA[i] * vecA[i];
    mB += vecB[i] * vecB[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  return dotProduct / (mA * mB);
}

class RagService {
  constructor(ollamaClient, storagePath) {
    this.client = ollamaClient;
    this.storagePath = storagePath;
    this.embeddings = [];
    this.loadEmbeddings();
  }

  loadEmbeddings() {
    if (fs.existsSync(this.storagePath)) {
      try {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        this.embeddings = JSON.parse(data);
        console.log(`Loaded ${this.embeddings.length} property embeddings from storage.`);
      } catch (error) {
        console.error('Failed to load embeddings:', error);
        this.embeddings = [];
      }
    }
  }

  async findRelevantContext(query, topN = 3) {
    if (!this.embeddings.length) {
      return '';
    }

    try {
      const queryEmbedding = await this.client.getEmbedding(query);
      if (!queryEmbedding) return '';

      const scored = this.embeddings.map((entry) => ({
        ...entry,
        score: cosineSimilarity(queryEmbedding, entry.embedding)
      }));

      // Sort by similarity score descending
      const topMatches = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);

      console.log('Top RAG matches:', topMatches.map(m => `${m.id} (${m.score.toFixed(3)})`));

      // Format matches into a knowledge context for the LLM
      return topMatches.map((m) => {
        return `[Property ID: ${m.id}] ${m.text}`;
      }).join('\n\n');
    } catch (error) {
      console.error('RAG semantic search failed:', error);
      return '';
    }
  }
}

module.exports = { RagService };
