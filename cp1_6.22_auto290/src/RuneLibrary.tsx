import React, { useCallback } from 'react';
import type { RuneElement, RuneLibraryItem } from './types';
import { RUNE_COLORS, RUNE_SYMBOLS, RUNE_NAMES } from './types';

interface RuneLibraryProps {
  library: RuneLibraryItem[];
  onDragStart: (element: RuneElement) => void;
  onDragEnd: () => void;
}

const RuneLibrary: React.FC<RuneLibraryProps> =