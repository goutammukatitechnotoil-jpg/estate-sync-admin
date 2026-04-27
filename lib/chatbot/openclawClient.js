const { OllamaClient } = require('./ollamaClient');

async function queryOpenClaw({ baseUrl, model, message, ragContext, history, preferences, userName }) {
  const client = new OllamaClient(baseUrl);

  const userPromptParts = [
    `User's Name: ${userName || 'Guest'}`,
    `Conversation history: ${JSON.stringify(history || [])}`,
    `Known preferences: ${JSON.stringify(preferences || {})}`,
    `Knowledge Context (Relevant properties from catalog):`,
    ragContext || 'No specific matching properties found in catalog yet.',
    `User query: ${message}`
  ];

  const payload = {
    model: model || 'qwen2.5:3b',
    messages: [
      {
        role: 'system',
        content: [
          'You are an elite Real Estate Advisor for a premium property bot.',
          'Your goal is to guide users through 3 core services: 1) Buy, 2) Sell, 3) Rent (Tenants and Landlords).',
          'PERSONA: Be professional, supportive, and focused. Do not use a personal name unless asked.',
          'KNOWLEDGE CONTEXT: Use the provided Knowledge context to inform your advice. Talk like a real advisor who knows these properties.',
          'SMART REPLY INSTRUCTION: Your "reply" field must be a complete, natural, and cohesive message to the user. It should include any needed clarifications or next steps inside the text itself. Do not repeat info.',
          'OPERATIONAL MODES:',
          '1. DISCOVERY MODE (MANDATORY for Greetings): If the user says "Hi", "Hello", "Hey", stay in Discovery Mode. Do NOT suggest IDs yet. Ask how you can help.',
          '2. RECOMMENDATION MODE: Once Location and Purpose are clear, suggest 1-3 best IDs from the Knowledge Context. Include them in "suggestedPropertyIds".',
          'STRICT RULES:',
          '- Only suggest properties present in the Knowledge Context.',
          '- If no matching properties exist in the context, explain this naturally. Do not invent property IDs.',
          'CRITICAL JSON FORMAT: Return ONLY a JSON object: { reply, filters, suggestedPropertyIds, intent, comparisonSummary }.',
          'Intents: greeting, search, followup, compare, sell, landlord, general, clarify.'
        ].join(' ')
      },
      {
        role: 'user',
        content: userPromptParts.join('\n\n')
      }
    ],
    format: 'json',
    stream: false
  };

  console.log(`Calling Ollama for chat with model ${payload.model}...`);
  const response = await client.getChatResponse(payload);

  const combined = response.message?.content?.trim();
  if (!combined) {
    throw new Error('Ollama returned no message content');
  }

  try {
    return JSON.parse(combined);
  } catch (error) {
    console.error('Failed to parse Ollama JSON output:', combined);
    throw new Error(`Ollama output was not valid JSON: ${error.message}`);
  }
}

module.exports = { queryOpenClaw };
