import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { StoryParagraph, StoryboardPanel } from '../../types';
import { generateStoryboard } from '../storyboard/storyboardGenerator';

export const MAX_WORDS = 300;

export function useStory() {
  const [paragraphs, setParagraphs] = useState<StoryParagraph[]>([]);
  const [storyboards, setStoryboards] = useState<StoryboardPanel[]>([]);
  const [currentAuthorIndex, setCurrentAuthorIndex] = useState<number>(0);
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
    setCurrentAuthorIndex((prev) => (prev + 1) % 2);

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
    isGenerating,
    generateError,
    addParagraph,
  };
}
