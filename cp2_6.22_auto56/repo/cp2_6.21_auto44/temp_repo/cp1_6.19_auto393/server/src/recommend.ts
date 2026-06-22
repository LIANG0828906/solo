export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  tags: string[];
  cover?: string;
  description?: string;
  owner: string;
  createdAt: string;
}

export interface Recommendation {
  book: Book;
  similarity: number;
}

function createVector(tags: string[], allTags: string[]): number[] {
  return allTags.map(tag => tags.includes(tag) ? 1 : 0);
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (normA * normB);
}

export function getRecommendations(
  targetBook: Book,
  allBooks: Book[],
  topN: number = 3
): Recommendation[] {
  const allTagsSet = new Set<string>();
  allBooks.forEach(book => {
    book.tags.forEach(tag => allTagsSet.add(tag));
  });
  const allTags = Array.from(allTagsSet);
  
  const targetVector = createVector(targetBook.tags, allTags);
  
  const recommendations: Recommendation[] = [];
  
  for (const book of allBooks) {
    if (book.id === targetBook.id) continue;
    
    const bookVector = createVector(book.tags, allTags);
    const similarity = cosineSimilarity(targetVector, bookVector);
    
    if (similarity > 0) {
      recommendations.push({
        book,
        similarity: Math.round(similarity * 100)
      });
    }
  }
  
  recommendations.sort((a, b) => b.similarity - a.similarity);
  
  return recommendations.slice(0, topN);
}
