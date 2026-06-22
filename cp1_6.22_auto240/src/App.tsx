import { useEffect, useReducer, useRef, useState, useCallback } from 'react';
import { AudioEngine } from './audio/AudioEngine';
import { BeatDetector, FrameData } from './rhythm/BeatDetector';
import { PatternEditor } from './editor/PatternEditor';
import {
  GameState,
  TrackType,
  Difficulty,
  Rating,
  RatingResult,
  Ripple,
  ActiveWave,
  Highlight,
  TRACK_COLORS,
  Pattern,
} from './types';
import { TrackPanel } from './components/TrackPanel';
import { Stage, createRipple, STAGE_CANVAS_CENTER } from './components/Stage';
import { ScoreHUD } from './components/ScoreHUD';
import { ControlBar } from './components/ControlBar';
import './index.css';

const STAGE_RADIUS = 300;
const GAME_DURATION = 30000;

interface RatingPopup {
  id: string;
  rating: Rating;
  x: number;
  y: number;
}

type GameAction =
  | { type: 'SET_BPM'; payload: number }
  | { type: 'SET_DIFFICULTY'; payload: Difficulty }
  | { type: 'SET_PATTERN'; payload: Pattern }
  | { type: 'SET_PHASE'; payload: GameState['phase'] }
  | { type: 'SET_SELECTED_TRACK'; payload: TrackType }
  | { type: 'START_GAME' }
  | { type: 'STOP_GAME' }
  | { type: 'APPLY_RATING'; payload: RatingResult }
  | { type: 'TICK_TIME'; payload: number }
  | { type: 'RESET_SCORE' };

const initialState: GameState = {
  phase: 'idle',
  bpm: 120,
  difficulty: 'normal',
  pattern: null,
  score: 0,
  combo: 0,
  maxCombo: 0,
  perfectCount: 0,
  goodCount: 0,
  missCount: 0,
  currentTime: 0,
  selectedTrack: 'drum',
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_BPM':
      return { ...state, bpm: action.payload };
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.payload };
    case 'SET_PATTERN':
      return { ...state, pattern: action.payload, bpm: action.payload.bpm };
    case 'SET_PHASE':
      return { ...state, phase: action.payload };
    case 'SET_SELECTED_TRACK':
      return { ...state, selectedTrack: action.payload };
    case 'START_GAME':
      return {
        ...state,
        phase: 'playing',
        score: 0,
        combo: 0,
        maxCombo: 0,
        perfectCount: 0,
        goodCount: 0,
        missCount: 0,
        currentTime: 0,
      };
    case 'STOP_GAME':
      return { ...state, phase: 'idle', currentTime: 0 };
    case 'APPLY_RATING': {
      const r = action.payload;
      const newCombo = r.rating === 'miss' ? 0 : state.combo + 1;
      const comboBonus = r.rating !== 'miss' ? Math.floor(newCombo / 10) * 10 : 0;
      return {
        ...state,
        score: state.score + r.score + comboBonus,
        combo: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
        perfectCount: state.perfectCount + (r.rating === 'perfect' ? 1 : 0),
        goodCount: state.goodCount + (r.rating === 'good' ? 1 : 0),
        missCount: state.missCount + (r.rating === 'miss' ? 1 : 0),
      };
    }
    case 'TICK_TIME': {
      const newTime = action.payload;
      if (newTime >= GAME_DURATION && state.phase === 'playing') {
        return { ...state, phase: 'finished', currentTime: GAME_DURATION };
      }
      return { ...state, currentTime: Math.min(newTime, GAME_DURATION) };
    }
    case 'RESET_SCORE':
      return {
        ...state,
        score: 0,
        combo: 0,
        maxCombo: 0,
        perfectCount: 0,
        goodCount: 0,
        missCount: 0,
      };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const beatDetectorRef = useRef<BeatDetector | null>(null);
  const patternEditorRef = useRef<PatternEditor | null>(null);
  const gameStartTimeRef = useRef<number>(0);
  const scheduledBeatsRef = useRef<Set<string>>(new Set());
  const gameTimerRef = useRef<number | null>(null);

  const [frameData, setFrameData] = useState<FrameData>({
    waves: [],
    highlights: [],
    missCount: 0,
  });
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [ratingPopups, setRatingPopups] = useState<RatingPopup[]>([]);
  const [trackLastBeat, setTrackLastBeat] = useState<Record<TrackType, number>>({
    drum: 0,
    bass: 0,
    melody: 0,
    effect: 0,
  });

  const tracksState: { type: TrackType; enabled: boolean; volume: number; lastBeat: number }[] = [
    { type: 'drum', enabled: true, volume: 0.7, lastBeat: trackLastBeat.drum },
    { type: 'bass', enabled: true, volume: 0.7, lastBeat: trackLastBeat.bass },
    { type: 'melody', enabled: true, volume: 0.7, lastBeat: trackLastBeat.melody },
    { type: 'effect', enabled: true, volume: 0.7, lastBeat: trackLastBeat.effect },
  ];

  useEffect(() => {
    audioEngineRef.current = new AudioEngine();
    beatDetectorRef.current = new BeatDetector(STAGE_RADIUS);
    patternEditorRef.current = new PatternEditor();

    const defaultPattern = patternEditorRef.current.generatePreset('normal');
    dispatch({ type: 'SET_PATTERN', payload: defaultPattern });

    audioEngineRef.current.onTrackBeat = (track) => {
      setTrackLastBeat((prev) => ({ ...prev, [track]: performance.now() }));
    };

    beatDetectorRef.current.onFrame = (data) => {
      setFrameData(data);
    };

    beatDetectorRef.current.onRating = (result) => {
      if (state.phase !== 'playing') return;
      dispatch({ type: 'APPLY_RATING', payload: result });

      if (result.rating !== 'miss') {
        audioEngineRef.current?.playBeat(result.track);
      }

      const angle = (result.sector / 12) * Math.PI * 2 - Math.PI / 2;
      const x = STAGE_CANVAS_CENTER.x + Math.cos(angle) * (STAGE_RADIUS + 30);
      const y = STAGE_CANVAS_CENTER.y + Math.sin(angle) * (STAGE_RADIUS + 30);
      const popupId = `${result.waveId}-popup`;
      setRatingPopups((prev) => [
        ...prev,
        { id: popupId, rating: result.rating, x, y },
      ]);
      setTimeout(() => {
        setRatingPopups((prev) => prev.filter((p) => p.id !== popupId));
      },