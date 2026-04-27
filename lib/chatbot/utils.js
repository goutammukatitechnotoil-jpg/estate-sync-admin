function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatList(items) {
  return items.filter(Boolean).join(', ');
}

function isValidPhone(value) {
  return /^\+?[0-9][0-9\s-]{7,14}$/.test(String(value || '').trim());
}

function safeJsonParse(content, fallback) {
  try {
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

function levenshtein(a, b) {
  const source = String(a || '');
  const target = String(b || '');
  const matrix = Array.from({ length: target.length + 1 }, () => []);

  for (let i = 0; i <= target.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= source.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= target.length; i += 1) {
    for (let j = 1; j <= source.length; j += 1) {
      const cost = target[i - 1] === source[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[target.length][source.length];
}

function fuzzyTokenMatch(token, candidates) {
  for (const candidate of candidates) {
    if (candidate === token) return true;
    if (candidate.includes(token) || token.includes(candidate)) return true;
    if (Math.abs(candidate.length - token.length) <= 2 && levenshtein(candidate, token) <= 1) return true;
  }
  return false;
}

module.exports = {
  normalizeText,
  formatList,
  isValidPhone,
  safeJsonParse,
  levenshtein,
  fuzzyTokenMatch
};
