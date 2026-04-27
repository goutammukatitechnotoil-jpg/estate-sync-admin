// Changed path to ../../data/properties.json
const properties = require('../../data/properties.json');
const { normalizeText, fuzzyTokenMatch } = require('./utils');

function tokenize(value) {
  return normalizeText(value).split(' ').filter(Boolean);
}

function uniqueTokens(value) {
  return [...new Set(tokenize(value))];
}

function overlapScore(tokensA, tokensB) {
  let score = 0;
  for (const token of tokensA) {
    if (fuzzyTokenMatch(token, tokensB)) {
      score += token.length > 4 ? 4 : 2;
    }
  }
  return score;
}

function parseBudgetToLakhs(priceText) {
  const normalized = normalizeText(priceText);
  const match = normalized.match(/(\d+(?:\.\d+)?)(?:\s*)(crore|crores|lakh|lakhs|lac|lacs)?/);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2] || 'lakh';
  if (['crore', 'crores'].includes(unit)) return amount * 100;
  return amount;
}

function matchesBudget(property, budget) {
  if (!budget) return true;
  const amount = parseBudgetToLakhs(property.price);
  if (!amount) return true;
  if (budget.min && amount < budget.min) return false;
  if (budget.max && amount > budget.max) return false;
  return true;
}

function matchesAmenities(property, amenities = []) {
  if (!amenities.length) return true;
  const propertyAmenities = tokenize((property.amenities || []).join(' '));
  return amenities.every((item) => fuzzyTokenMatch(normalizeText(item), propertyAmenities));
}

function propertyTokens(property) {
  return uniqueTokens([
    property.id,
    property.title,
    property.type,
    property.purpose,
    property.location,
    property.price,
    property.size,
    property.bhk,
    property.availability,
    ...(property.amenities || []),
    ...(property.nearby || []),
    property.description,
    property.furnishing || '',
    property.status || ''
  ].join(' '));
}

function scoreProperty(property, queryTokens, preferences = {}) {
  const tokens = propertyTokens(property);
  let score = overlapScore(queryTokens, tokens);

  if (preferences.location && fuzzyTokenMatch(preferences.location, tokenize(property.location))) score += 6;
  if (preferences.bhk && normalizeText(property.bhk).includes(preferences.bhk)) score += 4;
  if (preferences.type && fuzzyTokenMatch(preferences.type, tokenize(property.type))) score += 4;
  if (preferences.purpose && fuzzyTokenMatch(preferences.purpose, tokenize(property.purpose))) score += 4;
  if (preferences.amenities?.length && matchesAmenities(property, preferences.amenities)) score += 4;
  if (preferences.budget && matchesBudget(property, preferences.budget)) score += 5;
  if (preferences.freeText) score += overlapScore(uniqueTokens(preferences.freeText), tokens);

  return score;
}

function matchesLocation(property, location) {
  if (!location) return true;
  const propertyLoc = tokenize(property.location);
  const searchLoc = tokenize(location);
  return searchLoc.some((token) => fuzzyTokenMatch(token, propertyLoc));
}

function matchesPurpose(property, purpose) {
  if (!purpose) return true;
  return normalizeText(property.purpose) === normalizeText(purpose);
}

function searchProperties(query, maxResults, preferences = {}) {
  const queryTokens = uniqueTokens(query);
  const preferenceTokens = uniqueTokens([
    preferences.purpose,
    preferences.type,
    preferences.bhk,
    preferences.location,
    ...(preferences.amenities || []),
    preferences.freeText || ''
  ].join(' '));
  const combinedTokens = [...new Set([...queryTokens, ...preferenceTokens])];

  return properties
    .filter((property) => matchesPurpose(property, preferences.purpose))
    .filter((property) => matchesLocation(property, preferences.location))
    .filter((property) => matchesBudget(property, preferences.budget))
    .filter((property) => matchesAmenities(property, preferences.amenities || []))
    .map((property) => ({ property, score: scoreProperty(property, combinedTokens, preferences) }))
    .filter((entry) => entry.score > 0 || Boolean(preferences.budget))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((entry) => entry.property);
}

function getPropertyById(id) {
  const normalized = normalizeText(id);
  return properties.find((property) => normalizeText(property.id) === normalized);
}

function formatPropertyCard(property) {
  return [
    `🏠 ${property.title}`,
    `Property ID: ${property.id}`,
    `Purpose: ${property.purpose}`,
    `Type: ${property.type}`,
    `Location: ${property.location}`,
    `Price: ${property.price}`,
    `Size: ${property.size}`,
    `BHK: ${property.bhk}`,
    `Availability: ${property.availability}`,
    `Furnishing: ${property.furnishing || 'Not specified'}`,
    `Status: ${property.status || 'Ready to move'}`,
    `Amenities: ${(property.amenities || []).join(', ')}`,
    `Nearby: ${(property.nearby || []).join(', ')}`,
    `About: ${property.description}`
  ].join('\n');
}

function formatPropertySummary(property) {
  return `${property.id} | ${property.title} | ${property.price} | ${property.location}`;
}

function buildRecommendationText(results, preferences) {
  if (!results.length) {
    return 'I do not have a strong recommendation yet.';
  }

  const top = results[0];
  const reasons = [];
  if (preferences.location) reasons.push(`location match: ${top.location}`);
  if (preferences.bhk) reasons.push(`BHK match: ${top.bhk}`);
  if (preferences.type) reasons.push(`type match: ${top.type}`);
  if (preferences.purpose) reasons.push(`purpose: ${top.purpose}`);
  if (preferences.budget) reasons.push(`budget fit: ${top.price}`);
  if (preferences.amenities?.length) reasons.push(`amenities fit: ${(top.amenities || []).join(', ')}`);

  return `Best match right now is ${top.title}. ${reasons.length ? `Why it fits: ${reasons.join(', ')}.` : ''}`.trim();
}

function getPrimaryPhoto(property) {
  return (property.photos || [])[0] || null;
}

module.exports = {
  searchProperties,
  getPropertyById,
  formatPropertyCard,
  formatPropertySummary,
  buildRecommendationText,
  getPrimaryPhoto,
  properties
};
