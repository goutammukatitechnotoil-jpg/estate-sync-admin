const {
  companyName,
  agentName,
  agentPhone,
  openclawBaseUrl,
  openclawModel,
} = require('./config');
const { queryOpenClaw } = require('./openclawClient');
const { getPropertyById, formatPropertyCard, getPrimaryPhoto } = require('./propertyService');
const { welcomeMessage, aiUnavailableMessage } = require('./messages');
import { sessions, leads, whatsapp, ragService } from './instances';

function mapAiFiltersToPreferences(filters: any = {}, originalText: string = '') {
  return {
    purpose: filters.purpose || '',
    type: filters.type || '',
    bhk: filters.bhk || '',
    location: filters.location || '',
    amenities: filters.amenities || [],
    budget: filters.budgetMin || filters.budgetMax ? { min: filters.budgetMin || null, max: filters.budgetMax || null } : null,
    freeText: originalText.toLowerCase()
  };
}

async function getAiAssistance(chatId: string, text: string, session: any) {
  try {
    const ragContext = await ragService.findRelevantContext(text);
    return await queryOpenClaw({
      baseUrl: openclawBaseUrl,
      model: openclawModel,
      message: text,
      ragContext,
      history: session.history || [],
      preferences: session.preferences || {},
      userName: session.userName
    });
  } catch (error) {
    console.error('getAiAssistance error:', error);
    return { error: true };
  }
}

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

export async function handleIncoming(chatId: string, text: string, whatsappName: string) {
  console.log(`Processing message from ${whatsappName} (${chatId}): ${text}`);
  
  let session = sessions.get(chatId);

  // 1. Handle "Hi" / Start Command
  if (text.toLowerCase() === 'hi' || text.toLowerCase() === 'hello' || text.toLowerCase() === '/start') {
    if (!session.userName || session.userName === 'Guest' || session.userName === whatsappName) {
      // NEW USER (or reset) - Send first template
      sessions.clear(chatId);
      sessions.update(chatId, { state: 'AWAITING_NAME', whatsappName: whatsappName });
      await whatsapp.sendTemplate(chatId, 'welcome_message_new_user');
    } else {
      // EXISTING USER - Greet by name
      const greeting = `Hi ${session.userName}, welcome back to ${companyName}! How can I help you today?`;
      sessions.pushHistory(chatId, 'assistant', greeting);
      await whatsapp.sendMessage(chatId, greeting);
    }
    return;
  }

  // 2. Handle Name Collection (Onboarding State)
  if (session.state === 'AWAITING_NAME') {
    const collectedName = text.trim();
    sessions.update(chatId, { 
      userName: collectedName, 
      state: null 
    });
    // Send 2nd template with the name as a parameter
    await whatsapp.sendTemplate(chatId, 'new_user_2nd_message', [collectedName]);
    return;
  }

  sessions.pushHistory(chatId, 'user', text);

  try {
    const leadResult = leads.handle(chatId, text);
    if (leadResult) {
      if (!leadResult.done) {
        sessions.pushHistory(chatId, 'assistant', leadResult.reply);
        await whatsapp.sendMessage(chatId, leadResult.reply);
        return;
      }
      const session = sessions.get(chatId);
      const reply = `Thanks ${leadResult.lead.name}. ${agentName} will contact you soon. requirement summary: ${session.preferences.freeText || 'General Inquiry'}. Direct contact: ${agentPhone}.`;
      sessions.pushHistory(chatId, 'assistant', reply);
      await whatsapp.sendMessage(chatId, reply);
      return;
    }

    const session = sessions.get(chatId);
    const aiResponse = await getAiAssistance(chatId, text, session);

    if (aiResponse?.error) {
      const warning = aiUnavailableMessage();
      await whatsapp.sendMessage(chatId, warning);
      return;
    }

    const combinedMessage = aiResponse?.reply || '';
    const aiPreferences = aiResponse && !aiResponse.error ? mapAiFiltersToPreferences(aiResponse.filters, text) : null;
    const mergedPreferences = {
      ...session.preferences,
      ...(aiPreferences || {}),
      freeText: text.toLowerCase()
    };

    let results = (aiResponse && !aiResponse.error && aiResponse.suggestedPropertyIds || [])
      .map((id: string) => getPropertyById(id))
      .filter(Boolean);

    if (aiResponse.intent === 'greeting') {
      results = [];
      mergedPreferences.location = '';
    }

    sessions.update(chatId, {
      preferences: mergedPreferences,
      lastResults: results.map((p: any) => p.id)
    });

    if (combinedMessage) {
      sessions.pushHistory(chatId, 'assistant', combinedMessage);
      await whatsapp.sendMessage(chatId, combinedMessage);
    }

    if (results.length) {
      await sendProperties(chatId, results);
    }

  } catch (error) {
    console.error('Bot processing error:', error);
    await whatsapp.sendMessage(chatId, 'Sorry, I encountered an error. Please try saying "Hi" to restart.');
  }
}
