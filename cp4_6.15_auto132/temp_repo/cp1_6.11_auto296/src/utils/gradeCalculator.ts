
import { Grade } from '../types';

export function calculateGrade(textureDensity: number, symmetry: number, soundFrequency: number): Grade {
  const score = (textureDensity * 0.4 + symmetry * 0.35 + soundFrequency * 0.25);
  
  if (score >= 85) return '极品';
  if (score >= 70) return '上品';
  if (score >= 55) return '中品';
  return '下品';
}

export function getGradeColor(grade: Grade): string {
  switch (grade) {
    case '极品': return '#CC2936';
    case '上品': return '#D4A017';
    case '中品': return '#2E7D32';
    case '下品': return '#757575';
  }
}

export function calculatePrice(grade: Grade, basePrice?: number): number {
  if (basePrice !== undefined) return basePrice;
  
  switch (grade) {
    case '极品': return Math.floor(Math.random() * 3000) + 7000;
    case '上品': return Math.floor(Math.random() * 3000) + 3000;
    case '中品': return Math.floor(Math.random() * 1500) + 1000;
    case '下品': return Math.floor(Math.random() * 900) + 100;
  }
}

export function seededRandom(seed: number): () => number {
  let s = seed;
  return function() {
    s = Math.sin(s * 9999) * 10000;
    return s - Math.floor(s);
  };
}
