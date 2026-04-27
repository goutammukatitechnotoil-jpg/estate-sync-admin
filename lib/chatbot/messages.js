function welcomeMessage(companyName, firstName) {
  return `Hi ${firstName}, welcome to ${companyName}. I can help you find your dream home, sell your property, or list/search for rentals.`;
}

function helpMessage() {
  return [
    'Here is how I can assist you today:',
    '🏠 *Buy/Rent*: Use "Buy Property" or "Rent Property" to search for listings. You can search specifically like: "2bhk in sarjapur" or "apartment for rent under 50k".',
    '💰 *Sell*: Use "Sell Property" to share your property details with us. An agent will call you to discuss the listing.',
    '🔑 *Landlord*: Click "Rent Property" then "List My Property" if you want to find a tenant for your flat/villa.',
    '🧠 *Smart Search*: Just type what you need naturally, and I will understand!',
    '📞 *Talk to Agent*: Use this if you want an immediate call from Pranav.'
  ].join('\n\n');
}

function noResultsMessage() {
  return 'I could not find a close match. Try a location, BHK, type, or budget. Example: Whitefield 2bhk rent.';
}

function smartSearchIntro() {
  return 'Smart Search is on. Tell me your requirement naturally, e.g.: "3 BHK villa in Sarjapur under 200 lakhs" or "I want to sell my apartment in Mumbai".';
}

function preferenceSummaryMessage(summary) {
  return summary
    ? `Got it. I am searching based on: ${summary}`
    : 'Tell me what kind of property you need. Even short searches like whitefield 2bhk or questions like do you have apartment in whitefield work.';
}

function clarificationMessage() {
  return 'Tell me any detail you know, even if it is short or misspelled. For example: Whitefield, 2 BHK, rent vila, apartment with gym, or P101.';
}

function aiUnavailableMessage() {
  return 'The smart reasoning layer is unavailable right now, so I am using local search instead.';
}

function adminLeadMessage(lead, summary) {
  return [
    '📥 New real estate lead',
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    `Interest: ${lead.interest}`,
    `Preference summary: ${summary || 'Not captured'}`,
    `Created: ${lead.completedAt}`
  ].join('\n');
}

module.exports = {
  welcomeMessage,
  helpMessage,
  noResultsMessage,
  smartSearchIntro,
  preferenceSummaryMessage,
  clarificationMessage,
  aiUnavailableMessage,
  adminLeadMessage
};
