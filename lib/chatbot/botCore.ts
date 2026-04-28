const {
  companyName,
  agentName,
  agentPhone,
  openclawBaseUrl,
  openclawModel,
} = require('./config');

const { queryOpenClaw } = require('./openclawClient');
const { getPropertyById, formatPropertyCard, getPrimaryPhoto } = require('./propertyService');
import { sessions, leads, whatsapp, ragService } from './instances';

// --------------------
// TYPES
// --------------------
type AiFilters = {
  purpose?: string;
  type?: string;
  bhk?: string;
  location?: string;
  amenities?: string[];
  budgetMin?: number;
  budgetMax?: number;
};

type AiResponse = {
  reply?: string;
  intent?: string;
  filters?: AiFilters;
  suggestedPropertyIds?: string[];
  error?: boolean;
};

type SessionType = {
  userName?: string;
  preferences?: any;
  history?: any[];
  isHumanHandover?: boolean;
};

// --------------------
// AI FILTER MAPPING
// --------------------
function mapAiFiltersToPreferences(
  filters: AiFilters = {},
  originalText: string = ''
) {
  return {
    purpose: filters.purpose || '',
    type: filters.type || '',
    bhk: filters.bhk || '',
    location: filters.location || '',
    amenities: filters.amenities || [],
    budget:
      filters.budgetMin || filters.budgetMax
        ? { min: filters.budgetMin || null, max: filters.budgetMax || null }
        : null,
    freeText: originalText.toLowerCase(),
  };
}

// --------------------
// AI CALL
// --------------------
async function getAiAssistance(
  chatId: string,
  text: string,
  session: SessionType
): Promise<AiResponse> {
  try {
    const ragContext = await ragService.findRelevantContext(text);

    let response: any = await queryOpenClaw({
      baseUrl: openclawBaseUrl,
      model: openclawModel,
      message: text,
      ragContext,
      history: (session.history || []).slice(-5),
      preferences: session.preferences || {},
      userName: session.userName,

      systemPrompt: `
You are a professional real estate consultant for ${companyName}.

Speak like a human. Keep answers short.

Guide the user step by step.

Never give random answers.
Never mention AI/system.

PRICE:
"That depends on size and location. Share your budget."

LOCATION:
"Well-connected area with strong growth."

INVESTMENT:
"Good for long-term growth."

LEGAL:
"I can guide you through documents."

CONFUSED:
"Tell me your top priority — budget, location, or usage."

SITE VISIT:
"Would you like to visit this weekend or weekday?"

OUTPUT STRICT JSON:
{
  "reply": "",
  "intent": "",
  "filters": {},
  "suggestedPropertyIds": []
}
`
    });

    // SAFE PARSE
    if (typeof response === 'string') {
      try {
        response = JSON.parse(response);
      } catch {
        response = { reply: response };
      }
    }

    return response as AiResponse;

  } catch (error) {
    console.error('AI error:', error);
    return { error: true };
  }
}

// --------------------
// SEND PROPERTY
// --------------------
async function sendProperty(to: string, property: any) {
  const caption = formatPropertyCard(property);
  const photo = getPrimaryPhoto(property);

  const buttons = [{ id: `interested:${property.id}`, title: 'Interested' }];

  if (photo) {
    await whatsapp.sendInteractiveButtons(to, photo, caption, buttons);
  } else {
    await whatsapp.sendMessage(to, caption);
  }
}

async function sendProperties(to: string, results: any[]) {
  for (const property of results) {
    await sendProperty(to, property);
  }
}

// --------------------
// MAIN HANDLER
// --------------------
export async function handleIncoming(
  chatId: string,
  text: string,
  whatsappName: string
) {
  console.log(`Processing: ${whatsappName} (${chatId}) -> ${text}`);

  let session: SessionType = sessions.get(chatId) || {};
  const lowerText = text.toLowerCase();

  // STOP BOT if agent takeover
  if (session.isHumanHandover) return;

  // --------------------
  // GREETING
  // --------------------
  const greetings = ['hi', 'hello', 'hey', '/start'];

  if (greetings.includes(lowerText)) {
    const reply = session.userName
      ? `Hi ${session.userName}, how can I help you today?`
      : `Hi, welcome to ${companyName}. I can help you buy, sell, or rent property. What are you looking for?`;

    await whatsapp.sendMessage(chatId, reply);
    return;
  }

  sessions.pushHistory(chatId, 'user', text);

  try {
    // --------------------
    // LEAD FLOW
    // --------------------
    const leadResult = leads.handle(chatId, text);

    if (leadResult) {
      if (!leadResult.done) {
        await whatsapp.sendMessage(chatId, leadResult.reply);
        return;
      }

      const reply = `Thanks ${leadResult.lead.name}. ${agentName} will contact you. You can also reach: ${agentPhone}`;
      await whatsapp.sendMessage(chatId, reply);
      return;
    }

    // --------------------
    // AGENT HANDOVER
    // --------------------
    if (
      lowerText === 'talk to agent' ||
      lowerText === 'connect agent' ||
      lowerText === 'call me'
    ) {
      sessions.update(chatId, { isHumanHandover: true });

      await whatsapp.sendMessage(
        chatId,
        `Connecting you to expert 👉 https://wa.me/${agentPhone}`
      );
      return;
    }

    // --------------------
    // AI RESPONSE
    // --------------------
    const aiResponse = await getAiAssistance(chatId, text, session);

    if (aiResponse.error) {
      await whatsapp.sendMessage(
        chatId,
        "Tell me your budget and location."
      );
      return;
    }

    let reply =
      typeof aiResponse.reply === 'string' && aiResponse.reply.length < 400
        ? aiResponse.reply
        : "Tell me your requirement.";

    const invalid = ['error', 'ai', 'technical', 'delay'];

    if (invalid.some(w => reply.toLowerCase().includes(w))) {
      reply = "Tell me your requirement.";
    }

    await whatsapp.sendMessage(chatId, reply);

    // --------------------
    // PROPERTY RESULTS
    // --------------------
    const ids = Array.isArray(aiResponse.suggestedPropertyIds)
      ? aiResponse.suggestedPropertyIds
      : [];

    const results = ids
      .map((id: string) => getPropertyById(id))
      .filter(Boolean);

    if (results.length) {
      await sendProperties(chatId, results);
    }

  } catch (error) {
    console.error('Error:', error);
    await whatsapp.sendMessage(chatId, 'Something went wrong. Please try again.');
  }
}