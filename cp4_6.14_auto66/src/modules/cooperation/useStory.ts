import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { StoryParagraph, StoryboardPanel } from '../../types';
import { generateStoryboard } from '../storyboard/storyboardGenerator';

export const MAX_WORDS = 300;
export const PARTICIPANT_COUNT = 2;

export function useStory() {
  const [paragraphs, setParagraphs] = useState<StoryParagraph[]>([]);
  const [storyboards, setStoryboards] = useState<StoryboardPanel[]>([]);
  const [currentAuthorIndex, setCurrentAuthorIndex] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const addParagraph = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_WORDS) return;

    const newParagraph: StoryParagraph = {
      id: uuidv4(),
      content: trimmed,
      authorIndex: currentAuthorIndex,
      timestamp: Date.now(),
    };

    const updatedParagraphs = [...paragraphs, newParagraph];
    setParagraphs(updatedParagraphs);

    const nextAuthorIndex = (currentAuthorIndex + 1) % PARTICIPANT_COUNT;
    setCurrentAuthorIndex(nextAuthorIndex);

    if (nextAuthorIndex === 0) {
      setCurrentRound((prev) => prev + 1);
    }

    setIsGenerating(true);
    setGenerateError(null);
    try {
      const result = await generateStoryboard(updatedParagraphs);
      setStoryboards(result);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : '分镜生成失败');
    } finally {
      setIsGenerating(false);
    }
  }, [paragraphs, currentAuthorIndex]);

  return {
    paragraphs,
    storyboards,
    currentAuthorIndex,
    currentRound,
    isGenerating,
    generateError,
    addParagraph,
  };
}
