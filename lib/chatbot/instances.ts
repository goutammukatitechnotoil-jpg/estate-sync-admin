import path from 'path';

const { JsonStore } = require('./storage');
const { LeadService } = require('./leadService');
const { SessionService } = require('./sessionService');
const { WhatsappService } = require('./whatsappService');
const { OllamaClient } = require('./ollamaClient');
const { RagService } = require('./ragService');
const { storageDir, openclawBaseUrl } = require('./config');

// Use global to maintain state across hot-reloads in Next.js development
const globalForChatbot = global as unknown as {
  store: any;
  leads: any;
  sessions: any;
  whatsapp: any;
  ollamaClient: any;
  ragService: any;
};

// Next.js process.cwd() points to the root of the project
const absoluteStorageDir = path.join(process.cwd(), 'storage');
const absoluteDataDir = path.join(process.cwd(), 'data');

export const store = globalForChatbot.store || new JsonStore(absoluteStorageDir);
export const leads = globalForChatbot.leads || new LeadService(store);
export const sessions = globalForChatbot.sessions || new SessionService(store);
export const whatsapp = new WhatsappService(); // Always use the latest class definition
export const ollamaClient = globalForChatbot.ollamaClient || new OllamaClient(openclawBaseUrl);
export const ragService = globalForChatbot.ragService || new RagService(ollamaClient, path.join(absoluteStorageDir, 'embeddings.json'));

if (process.env.NODE_ENV !== 'production') {
  globalForChatbot.store = store;
  globalForChatbot.leads = leads;
  globalForChatbot.sessions = sessions;
  globalForChatbot.whatsapp = whatsapp;
  globalForChatbot.ollamaClient = ollamaClient;
  globalForChatbot.ragService = ragService;
}
