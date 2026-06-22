function tokenize(text: string): string[] {
  const cleanText = text.toLowerCase().trim();
  const tokens: string[] = [];
  
  let currentWord = '';
  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    if (/[a-zA-Z0-9]/.test(char)) {
      currentWord += char;
    } else {
      if (currentWord) {
        tokens.push(currentWord);
        currentWord = '';
      }
      if (/[\u4e00-\u9fa5]/.test(char)) {
        tokens.push(char);
      }
    }
  }
  if (currentWord) {
    tokens.push(currentWord);
  }
  
  return tokens.filter(t => t.length > 0);
}

function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  const total = tokens.length;
  
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  
  for (const [token, count] of tf) {
    tf.set(token, count / total);
  }
  
  return tf;
}

function computeIDF(allDocuments: string[][]): Map<string, number> {
  const idf = new Map<string, number>();
  const docCount = allDocuments.length;
  const termDocCount = new Map<string, number>();
  
  for (const doc of allDocuments) {
    const uniqueTerms = new Set(doc);
    for (const term of uniqueTerms) {
      termDocCount.set(term, (termDocCount.get(term) || 0) + 1);
    }
  }
  
  for (const [term, count] of termDocCount) {
    idf.set(term, Math.log((docCount + 1) / (count + 1)) + 1);
  }
  
  return idf;
}

function computeTFIDFVector(
  tf: Map<string, number>,
  idf: Map<string, number>,
  allTerms: string[]
): number[] {
  return allTerms.map(term => {
    const tfValue = tf.get(term) || 0;
    const idfValue = idf.get(term) || 0;
    return tfValue * idfValue;
  });
}

function cosineSimilarity(vec1: number[], vec2: number[]): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);
  
  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }
  
  return dotProduct / (norm1 * norm2);
}

export function calculateSimilarity(text1: string, text2: string): number {
  if (!text1.trim() || !text2.trim()) {
    return 0;
  }
  
  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);
  
  if (tokens1.length === 0 || tokens2.length === 0) {
    return 0;
  }
  
  const allDocuments = [tokens1, tokens2];
  
  const tf1 = computeTF(tokens1);
  const tf2 = computeTF(tokens2);
  const idf = computeIDF(allDocuments);
  
  const allTerms = new Set([...tf1.keys(), ...tf2.keys()]);
  const allTermsArray = Array.from(allTerms);
  
  const vec1 = computeTFIDFVector(tf1, idf, allTermsArray);
  const vec2 = computeTFIDFVector(tf2, idf, allTermsArray);
  
  return cosineSimilarity(vec1, vec2);
}

export function calculateAllSimilarities(
  cards: { id: string; content: string; contentType: string }[]
): { cardId1: string; cardId2: string; similarity: number }[] {
  const textCards = cards.filter(c => c.contentType === 'text' && c.content.trim());
  const results: { cardId1: string; cardId2: string; similarity: number }[] = [];
  
  for (let i = 0; i < textCards.length; i++) {
    for (let j = i + 1; j < textCards.length; j++) {
      const similarity = calculateSimilarity(textCards[i].content, textCards[j].content);
      if (similarity > 0.3) {
        results.push({
          cardId1: textCards[i].id,
          cardId2: textCards[j].id,
          similarity,
        });
      }
    }
  }
  
  return results;
}
