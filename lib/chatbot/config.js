function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  agentPhone: process.env.AGENT_PHONE || 'Not set',
  agentName: process.env.AGENT_NAME || 'Property Agent',
  companyName: process.env.COMPANY_NAME || 'Techno Estates',
  storageDir: process.env.STORAGE_DIR || 'storage',
  maxResults: Number(process.env.MAX_RESULTS || 5),
  adminChatId: process.env.ADMIN_CHAT_ID || '',
  openclawBaseUrl: process.env.OPENCLAW_BASE_URL || '',
  openclawToken: process.env.OPENCLAW_TOKEN || '',
  openclawModel: process.env.OPENCLAW_MODEL || 'openclaw/default',
  openclawEmbeddingModel: process.env.OPENCLAW_EMBEDDING_MODEL || 'nomic-embed-text',
  aisensyApiUrl: process.env.AISENSY_API_URL || 'https://apis.aisensy.com/project-apis/v1/project/69575f2519f35b117a22606b/messages',
  aisensyApiKey: process.env.AISENSY_API_KEY || 'd0aa7d3d8009db5a639ed'
};
