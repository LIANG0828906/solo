import { useState, useCallback, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import type { WordPosition, ArticleParagraph } from '../types';

interface ReadingPanelProps {
  paragraphs: ArticleParagraph[];
  onWordClick: (position: WordPosition) => void;
  activeWord: string | null;
}

function getSentenceFromWord(text: string, wordIndex: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  let currentIndex = 0;
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    const sentenceStart = text.indexOf(trimmed, currentIndex);
    const sentenceEnd = sentenceStart + trimmed.length;
    
    if (wordIndex >= sentenceStart && wordIndex <= sentenceEnd) {
      return trimmed;
    }
    currentIndex = sentenceEnd;
  }
  
  return text;
}

export function ReadingPanel({ paragraphs, onWordClick, activeWord }: ReadingPanelProps) {
  const [expandedParagraphs, setExpandedParagraphs] = useState<Set<number>>(
    new Set(paragraphs.map(p => p.id))
  );

  const toggleParagraph = useCallback((id: number) => {
    setExpandedParagraphs(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const renderParagraph = useCallback((paragraph: ArticleParagraph) => {
    const isExpanded = expandedParagraphs.has(paragraph.id);
    const words = paragraph.content.split(/(\s+|[.,!?;:])/);
    
    let wordIndex = 0;
    const elements = words.map((wordPart, index) => {
      if (wordPart.match(/^[\s.,!?;:]+$/)) {
        return wordPart;
      }
      
      if (!wordPart.trim()) {
        return wordPart;
      }

      const currentWordIndex = wordIndex;
      wordIndex += wordPart.length;
      
      const cleanWord = wordPart.replace(/[^a-zA-Z-]/g, '');
      if (!cleanWord || cleanWord.length < 2) {
        return wordPart;
      }

      const isActive = activeWord && activeWord.toLowerCase() === cleanWord.toLowerCase();

      return (
        <span
          key={index}
          className={isActive ? 'highlighted' : ''}
          onClick={(e) => {
            e.stopPropagation();
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const context = getSentenceFromWord(paragraph.content, currentWordIndex);
            
            onWordClick({
              x: rect.left + rect.width / 2,
              y: rect.top,
              word: cleanWord,
              context,
              paragraph: paragraph.content
            });
          }}
        >
          {wordPart}
        </span>
      );
    });

    return (
      <div key={paragraph.id} className="paragraph-container">
        <div 
          className="paragraph-header"
          onClick={() => toggleParagraph(paragraph.id)}
        >
          <ChevronRight 
            size={16} 
            className={`paragraph-toggle ${isExpanded ? 'expanded' : ''}`} 
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'system-ui, sans-serif', fontWeight: 600 }}>
            Paragraph {paragraph.id}
          </span>
        </div>
        <div className={`paragraph-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          {elements}
        </div>
      </div>
    );
  }, [expandedParagraphs, onWordClick, activeWord, toggleParagraph]);

  const memoizedParagraphs = useMemo(() => 
    paragraphs.map(renderParagraph),
    [paragraphs, renderParagraph]
  );

  return (
    <div className="reading-panel">
      {memoizedParagraphs}
    </div>
  );
}
