import { useState, useCallback, useRef, useEffect } from 'react';
import type { WordDetail, WordPosition, LearningStats, CollectionWord } from '../types';
import { wordService } from '../services/wordService';

interface UseWordLookupReturn {
  selectedWord: WordPosition | null;
  wordDetail: WordDetail | null;
  isLoading: boolean;
  isCollected: boolean;
  stats: LearningStats | null;
  reviewWords: CollectionWord[];
  showReviewMode: boolean;
  setShowReviewMode: (show: boolean) => void;
  handleWordClick: (position: WordPosition) => Promise<void>;
  closeWordCard: () => void;
  toggleCollection: () => Promise<void>;
  refreshStats: () => Promise<void>;
  loadReviewWords: () => Promise<void>;
  submitReview: (id: string, quality: number) => Promise<CollectionWord | null>;
}

export function useWordLookup(): UseWordLookupReturn {
  const [selectedWord, setSelectedWord] = useState<WordPosition | null>(null);
  const [wordDetail, setWordDetail] = useState<WordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [reviewWords, setReviewWords] = useState<CollectionWord[]>([]);
  const [showReviewMode, setShowReviewMode] = useState(false);
  const currentLemmaRef = useRef<string>('');

  const refreshStats = useCallback(async () => {
    const newStats = await wordService.getStats();
    setStats(newStats);
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const handleWordClick = useCallback(async (position: WordPosition) => {
    if (isLoading) return;

    const startTime = performance.now();
    console.log(`[WordLookup] Looking up: "${position.word}"`);

    setIsLoading(true);
    setSelectedWord(position);
    setWordDetail(null);
    setIsCollected(false);

    try {
      const detail = await wordService.getWordDetail(
        position.word,
        position.context,
        position.paragraph
      );

      if (detail) {
        setWordDetail(detail);
        currentLemmaRef.current = detail.lemma;
        
        const collected = await wordService.checkIfCollected(detail.lemma);
        setIsCollected(collected);

        const totalTime = performance.now() - startTime;
        console.log(`[WordLookup] Total time: ${totalTime.toFixed(2)}ms`);
      }
    } catch (error) {
      console.error('[WordLookup] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const closeWordCard = useCallback(() => {
    setSelectedWord(null);
    setWordDetail(null);
    setIsCollected(false);
    currentLemmaRef.current = '';
  }, []);

  const toggleCollection = useCallback(async () => {
    if (!wordDetail || !selectedWord) return;

    if (isCollected) {
      const collections = await wordService.getCollections();
      const existing = collections.find(c => c.lemma === wordDetail.lemma);
      if (existing) {
        await wordService.removeFromCollection(existing.id);
        setIsCollected(false);
      }
    } else {
      await wordService.addToCollection(
        wordDetail.word,
        wordDetail.lemma,
        selectedWord.context
      );
      setIsCollected(true);
    }
    
    await refreshStats();
  }, [wordDetail, selectedWord, isCollected, refreshStats]);

  const loadReviewWords = useCallback(async () => {
    const words = await wordService.getDueWords();
    setReviewWords(words);
  }, []);

  const submitReview = useCallback(async (id: string, quality: number) => {
    const result = await wordService.submitReviewResult(id, quality);
    if (result) {
      setReviewWords(prev => prev.filter(w => w.id !== id));
      await refreshStats();
    }
    return result;
  }, [refreshStats]);

  return {
    selectedWord,
    wordDetail,
    isLoading,
    isCollected,
    stats,
    reviewWords,
    showReviewMode,
    setShowReviewMode,
    handleWordClick,
    closeWordCard,
    toggleCollection,
    refreshStats,
    loadReviewWords,
    submitReview,
  };
}
