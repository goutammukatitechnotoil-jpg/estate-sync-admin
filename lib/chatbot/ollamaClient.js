const http = require('http');

function postJson(urlString, headers, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...headers
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(new Error(`Invalid JSON from Ollama: ${error.message}`));
            }
            return;
          }
          reject(new Error(`Ollama request failed with ${res.statusCode}: ${data}`));
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Shared client for Ollama API interaction
 */
class OllamaClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async getChatResponse(payload) {
    const endpoint = `${this.baseUrl}/api/chat`;
    return await postJson(endpoint, {}, JSON.stringify(payload));
  }

  async getEmbedding(text, model = 'nomic-embed-text') {
    const endpoint = `${this.baseUrl}/api/embeddings`;
    try {
      const response = await postJson(endpoint, {}, JSON.stringify({ model, prompt: text }));
      return response.embedding;
    } catch (err) {
      if (err.message.includes('not found') && model !== 'qwen2.5:3b') {
        console.log(`Model ${model} not found for embeddings. Falling back to qwen2.5:3b...`);
        return this.getEmbedding(text, 'qwen2.5:3b');
      }
      throw err;
    }
  }
}

module.exports = { OllamaClient };
