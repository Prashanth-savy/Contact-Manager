/**
 * Calculate Levenshtein distance between two strings
 * Used for typo-tolerant search functionality
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  const n = str1.length;
  const m = str2.length;

  // If one string is empty, return the length of the other
  if (n === 0) return m;
  if (m === 0) return n;

  // Initialize the matrix
  for (let i = 0; i <= n; i++) {
    matrix[i] = [];
    matrix[i][0] = i;
  }

  for (let j = 0; j <= m; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[n][m];
}

/**
 * Calculate similarity percentage between two strings
 */
function calculateSimilarity(str1, str2) {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  
  if (maxLength === 0) return 100;
  
  return ((maxLength - distance) / maxLength) * 100;
}

/**
 * Check if two strings are similar based on a threshold
 */
function isSimilar(str1, str2, threshold = 70) {
  return calculateSimilarity(str1, str2) >= threshold;
}

/**
 * Find the best match from an array of strings
 */
function findBestMatch(target, candidates) {
  if (!candidates || candidates.length === 0) {
    return null;
  }

  let bestMatch = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    const score = calculateSimilarity(target, candidate);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  return {
    match: bestMatch,
    score: bestScore
  };
}

/**
 * Normalize string for better matching
 */
function normalizeString(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
    .replace(/[^\w\s@.-]/g, '')     // Remove special characters except email-related ones
    .replace(/\./g, ' ')            // Replace dots with spaces for better word matching
    .replace(/\s+/g, ' ')           // Clean up spaces again
    .trim();
}

/**
 * Extract searchable tokens from a string
 */
function extractTokens(str) {
  return normalizeString(str)
    .split(/\s+/)
    .filter(token => token.length > 0);
}

/**
 * Advanced search that considers multiple factors
 */
function advancedSearch(query, target, options = {}) {
  const {
    exactMatchBonus = 50,
    partialMatchBonus = 25,
    fuzzyThreshold = 60,
    maxDistance = 3
  } = options;

  const normalizedQuery = normalizeString(query);
  const normalizedTarget = normalizeString(target);
  
  // Exact match
  if (normalizedQuery === normalizedTarget) {
    return { score: 100, type: 'exact' };
  }

  // Partial match (query is substring of target)
  if (normalizedTarget.includes(normalizedQuery)) {
    const score = exactMatchBonus + (normalizedQuery.length / normalizedTarget.length) * partialMatchBonus;
    return { score, type: 'partial' };
  }

  // Token-based matching
  const queryTokens = extractTokens(query);
  const targetTokens = extractTokens(target);
  
  let tokenMatches = 0;
  let totalTokenScore = 0;

  for (const queryToken of queryTokens) {
    let bestTokenMatch = 0;
    
    for (const targetToken of targetTokens) {
      const tokenSimilarity = calculateSimilarity(queryToken, targetToken);
      bestTokenMatch = Math.max(bestTokenMatch, tokenSimilarity);
    }
    
    if (bestTokenMatch >= fuzzyThreshold) {
      tokenMatches++;
      totalTokenScore += bestTokenMatch;
    }
  }

  if (tokenMatches > 0) {
    const avgTokenScore = totalTokenScore / tokenMatches;
    const coverageScore = (tokenMatches / queryTokens.length) * 100;
    const score = (avgTokenScore + coverageScore) / 2;
    return { score, type: 'token' };
  }

  // Fuzzy matching as fallback
  const distance = levenshteinDistance(normalizedQuery, normalizedTarget);
  if (distance <= maxDistance) {
    const similarity = calculateSimilarity(normalizedQuery, normalizedTarget);
    return { score: similarity, type: 'fuzzy' };
  }

  return { score: 0, type: 'no_match' };
}

module.exports = {
  levenshteinDistance,
  calculateSimilarity,
  isSimilar,
  findBestMatch,
  normalizeString,
  extractTokens,
  advancedSearch
};