const path = require('path');
const fs = require('fs');
const { OllamaClient } = require('./ollamaClient');
const { DataLoader } = require('./dataLoader');
const { openclawBaseUrl, openclawEmbeddingModel, storageDir } = require('./config');

/**
 * Service to handle property indexing (RAG Knowledge Base)
 */
async function indexProperties() {
  console.log('--- Property Indexing Started ---');
  
  const ollama = new OllamaClient(openclawBaseUrl);
  // Using process.cwd() handles running it from Next.js root
  const dataDir = path.join(process.cwd(), 'data');
  const absoluteStorageDir = path.join(process.cwd(), storageDir || 'storage');
  const storagePath = path.join(absoluteStorageDir, 'embeddings.json');

  // 1. Create storage dir if not exists
  if (!fs.existsSync(absoluteStorageDir)) {
    fs.mkdirSync(absoluteStorageDir, { recursive: true });
  }

  // 2. Load all properties (JSON + CSV)
  const allProperties = DataLoader.loadAll ? DataLoader.loadAll(dataDir) : DataLoader.loadJson(path.join(dataDir, 'properties.json'));
  console.log(`Loaded ${allProperties.length} properties for indexing.`);

  const embeddings = [];

  // 3. Generate embeddings for each property
  for (const property of allProperties) {
    // We index primarily location, BHK, type, and description
    const searchableText = [
      `[Property ID: ${property.id}]`,
      `Title: ${property.title}.`,
      `Type: ${property.type}.`,
      `Purpose: ${property.purpose}.`,
      `Location: ${property.location}.`,
      `Price: ${property.price}.`,
      `Size: ${property.size}.`,
      `BHK: ${property.bhk}.`,
      `Amenities: ${property.amenities ? property.amenities.join(',') : 'None'}.`,
      `Description: ${property.description}`,
      `Nearby: ${property.nearby ? property.nearby.join(',') : 'None'}`
    ].join(' ');

    console.log(`Indexing ${property.id}: ${property.title}...`);

    try {
      const vector = await ollama.getEmbedding(searchableText, openclawEmbeddingModel);
      if (vector) {
        embeddings.push({
          id: property.id,
          text: searchableText,
          embedding: vector, // Note: the original used "vector" here but RAG search uses "embedding"
          metadata: {
            title: property.title,
            location: property.location,
            price: property.price
          }
        });
      }
    } catch (err) {
      console.error(`Failed to index ${property.id}:`, err.message);
    }
  }

  // 4. Save to embeddings.json
  fs.writeFileSync(storagePath, JSON.stringify(embeddings, null, 2));
  console.log(`--- Indexing Complete. Knowledge Base updated with ${embeddings.length} entries. ---`);
  
  return { success: true, count: embeddings.length };
}

// Support running directly from CLI
if (require.main === module) {
  indexProperties().catch(console.error);
}

module.exports = { indexProperties };
