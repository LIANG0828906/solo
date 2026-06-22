export interface Fragment {
  id: string;
  text: string;
  position: { row: number; col: number };
  edges: {
    top: number[];
    right: number[];
    bottom: number[];
    left: number[];
  };
  inkStyle: string;
  texture: number[];
  width: number;
  height: number;
  rotation: number;
}

export interface PlacedFragment extends Fragment {
  x: number;
  y: number;
  zIndex: number;
  isPlaced: boolean;
  matchScore: number;
}

export interface MatchResult {
  fragmentId: string;
  adjacentId: string;
  edge: 'top' | 'right' | 'bottom' | 'left';
  score: number;
  suggestedPosition: { x: number; y: number };
}

export interface MatchResponse {
  matches: MatchResult[];
  bestMatch: MatchResult | null;
}

export interface ScoreRequest {
  placedFragments: PlacedFragment[];
  totalTime: number;
  totalMoves: number;
}

export interface ScoreResponse {
  totalScore: number;
  accuracyScore: number;
  timeScore: number;
  efficiencyScore: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  poemRevealed: string;
}

export interface PoemData {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  content: string[];
  translation: string;
  appreciation: string;
}
