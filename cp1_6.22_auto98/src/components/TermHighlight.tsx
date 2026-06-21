import { useState, useRef, useEffect } from 'react';

type Language = 'zh' | 'en' | 'ja' | 'fr' | 'de';

interface Term {
  id: string;
  term: string;
  definition: string;
  language: Language;
}

interface TermHighlightProps {
  text: string;
  terms: Term[];
  onSelection?: (selected: string, rect: DOMRect) => void;
  className?: string;
}

export default function TermHighlight({ text, terms, onSelection, className }: TermHighlightProps) {
  const [hoveredTerm, setHoveredTerm] = useState<Term | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!onSelection) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const selectedText = selection.toString().trim();
    if (!selectedText) return;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      onSelection(selectedText, rect);
    }
  };

  const highlightText = (input: string) => {
    if (!terms.length) return [<span key="plain">{input}</span>];

    const escapedTerms = terms
      .filter((t) => t.term && t.term.trim())
      .sort((a, b) => b.term.length - a.term.length)
      .map((t) => ({ ...t, escaped: t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }));

    if (!escapedTerms.length) return [<span key="plain">{input}</span>];

    const regex = new RegExp(`(${escapedTerms.map((t) => t.escaped).join('|')})`, 'gi');
    const parts = input.split(regex);

    return parts.map((part, index) => {
      const matchedTerm = escapedTerms.find(
        (t) => part.toLowerCase() === t.term.toLowerCase()
      );
      if (matchedTerm) {
        return (
          <mark
            key={index}
            style={{
              backgroundColor: 'var(--highlight)',
              borderRadius: '3px',
              padding: '1px 2px',
              cursor: 'help',
              color: 'inherit',
            }}
            onMouseEnter={(e) => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = setTimeout(() => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredTerm(matchedTerm);
                setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
              }, 300);
            }}
            onMouseLeave={() => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
              setHoveredTerm(null);
            }}
          >
            {part}
          </mark>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <span
      ref={containerRef}
      className={className}
      onMouseUp={handleMouseUp}
      style={{ userSelect: 'text', position: 'relative' }}
    >
      {highlightText(text)}
      {hoveredTerm && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPos.x,
            top: tooltipPos.y - 8,
            transform: 'translate(-50%, -100%)',
            backgroundColor: '#2a2a3e',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            maxWidth: '260px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            zIndex: 1000,
            pointerEvents: 'none',
            border: '1px solid var(--border-light)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px', color: '#ffd700' }}>
            {hoveredTerm.term}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            {hoveredTerm.definition}
          </div>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '-6px',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #2a2a3e',
            }}
          />
        </div>
      )}
    </span>
  );
}
