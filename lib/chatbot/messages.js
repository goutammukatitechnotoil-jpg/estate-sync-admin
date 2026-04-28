function welcomeMessage(companyName, firstName) {
  return `Hi ${firstName}, welcome to ${companyName}. I can help you find the right property based on your requirement. What are you looking for?`;
}

// ✅ OPTIONAL (use only if needed manually)
function quickHelpMessage() {
  return [
    'I can help you with:',
    '• Buying property',
    '• Renting property',
    '• Selling your property',
    '',
    'Just tell me your requirement like:',
    '"2BHK in Whitefield under 50L"'
  ].join('\n');
}

// ❌ Removed: aiUnavailableMessage

function adminLeadMessage(lead, summary) {
  return [
    '📥 New real estate lead',
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    `Interest: ${lead.interest}`,
    `Preference: ${summary || 'Not captured'}`,
    `Time: ${lead.completedAt}`
  ].join('\n');
}

module.exports = {
  welcomeMessage,
  quickHelpMessage,
  adminLeadMessage
};