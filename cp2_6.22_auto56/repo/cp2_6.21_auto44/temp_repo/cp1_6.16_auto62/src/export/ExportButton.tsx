import React, { useState } from 'react';
import { Waypoint, RouteData } from '../types';

interface ExportButtonProps {
  waypoints: Waypoint[];
}

const highlightJson = (json: string): React.ReactNode[] => {
  const tokens: React.ReactNode[] = [];
  let key = 0;

  const patterns: { regex: RegExp; className: string }[] = [
    { regex: /"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?/g, className: 'json-string' },
    { regex: /\b(true|false|null)\b/g, className: 'json-keyword' },
    { regex: /-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/g, className: 'json-number' },
    { regex: /[{}[\]]/g, className: 'json-bracket' },
  ];

  let lastIndex = 0;
  const combinedRegex = new RegExp(
    patterns.map((p) => `(${p.regex.source})`).join('|'),
    'g'
  );

  let match;
  while ((match = combinedRegex.exec(json)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(
        <span key={key++} className="json-bracket">
          {json.slice(lastIndex, match.index)}
        </span>
      );
    }

    const matchedText = match[0];

    if (/^"[^"]*"\s*:/.test(matchedText)) {
      tokens.push(
        <span key={key++}>
          <span className="json-keyword">{matchedText.slice(0, -1).replace(/:$/, '')}</span>
          <span className="json-bracket">:</span>
        </span>
      );
    } else if (/^"/.test(matchedText)) {
      tokens.push(
        <span key={key++} className="json-string">
          {matchedText}
        </span>
      );
    } else if (/\b(true|false|null)\b/.test(matchedText)) {
      tokens.push(
        <span key={key++} className="json-keyword">
          {matchedText}
        </span>
      );
    } else if (/^-?\d/.test(matchedText)) {
      tokens.push(
        <span key={key++} className="json-number">
          {matchedText}
        </span>
      );
    } else {
      tokens.push(
        <span key={key++} className="json-bracket">
          {matchedText}
        </span>
      );
    }

    lastIndex = match.index + matchedText.length;
  }

  if (lastIndex < json.length) {
    tokens.push(
      <span key={key++} className="json-bracket">
        {json.slice(lastIndex)}
      </span>
    );
  }

  return tokens;
};

export const ExportButton: React.FC<ExportButtonProps> = ({ waypoints }) => {
  const [exportedJson, setExportedJson] = useState<string | null>(null);

  const handleExport = () => {
    const routeData: RouteData = {
      waypoints: waypoints.sort((a, b) => a.createdAt - b.createdAt),
      routeCoordinates: waypoints
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((wp) => ({
          x: wp.x,
          y: wp.y,
          elevation: wp.elevation,
        })),
      exportedAt: Date.now(),
    };

    const jsonString = JSON.stringify(routeData, null, 2);
    setExportedJson(jsonString);
  };

  return (
    <div className="export-section">
      <button className="export-btn" onClick={handleExport}>
        导出旅行数据
      </button>
      {exportedJson && (
        <pre className="json-output">{highlightJson(exportedJson)}</pre>
      )}
    </div>
  );
};
