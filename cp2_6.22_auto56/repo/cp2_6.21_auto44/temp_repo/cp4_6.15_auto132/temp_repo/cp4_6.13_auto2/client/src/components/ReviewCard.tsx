import { useState, useCallback } from 'react';
import { X, BookOpen } from 'lucide-react';
import type { CollectionWord } from '../types';

interface ReviewCardProps {
  words: CollectionWord[];
  onClose: () => void;
  onSubmit: (id: string, quality: number) => Promise<CollectionWord | null>;
}

export function ReviewCard({ words, onClose, onSubmit }: ReviewCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIs