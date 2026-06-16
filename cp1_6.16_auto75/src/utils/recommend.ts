import { Book } from '../types';

function buildTagVector(books: Book[]): string[] {
  const tagSet = new Set<string>();
  books.forEach(book => {
    tagSet.add(book.category);
    book.tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet);
}

function bookToVector(book: Book, allTags: string[]): number[] {
  const vector = new Array(allTags.length).fill(0);
  allTags.forEach((tag, index) => {
    if (book.category === tag) {
      vector[index] = 2;
    }
    if (book.tags.includes(tag)) {
      vector[index] += 1;
    }
  });
  return vector;
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

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function getRecommendedBooks(
  currentBookId: string,
  books: Book[],
  topN: number = 3
): string[] {
  const currentBook = books.find(b => b.id === currentBookId);
  if (!currentBook) return [];

  const allTags = buildTagVector(books);
  const currentVector = bookToVector(currentBook, allTags);

  const similarities = books
    .filter(book => book.id !== currentBookId)
    .map(book => {
      const bookVector = bookToVector(book, allTags);
      const similarity = cosineSimilarity(currentVector, bookVector);
      return { bookId: book.id, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity);

  return similarities.slice(0, topN).map(item => item.bookId);
}
