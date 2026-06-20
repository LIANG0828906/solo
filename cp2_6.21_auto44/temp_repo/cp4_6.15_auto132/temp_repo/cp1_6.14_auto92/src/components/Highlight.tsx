import React from 'react';

interface HighlightProps {
  text: string;
  search: string;
}

export default function Highlight({ text, search }: HighlightProps) {
  if (!search.trim()) {
    return <>{text}</>;
  }

  const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <span key={index} className="highlight">
            {part}
          </span>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </>
  );
}
