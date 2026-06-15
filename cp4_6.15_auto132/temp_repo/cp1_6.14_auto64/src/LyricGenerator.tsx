import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Share2, RefreshCw, Sparkles, Send, Home, Grid3x3, X, Music } from 'lucide-react';
import ParticleBackground from './components/ParticleBackground';
import SpectrumVisualizer from './components/SpectrumVisualizer';
import { MOOD_CONFIGS, type Mood, type Lyric as LyricType } from '../shared/types';
import { generateLyric, adjustRhymeForWord, getRhymeHighlightWords } from './engine/lyricEngine';
import { lyricApi } from './utils/api';
import { v4 as uuidv4 } from 'uuid';

type Phase = 'input' | 'generating' | 'display';

export default function LyricGenerator() {
  const [phase, setPhase] = useState<Phase>('input');
  const [mood, setMood] = useState<Mood>('sad');
  const [keyword, setKeyword] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderHover, setPlaceholderHover] = useState(false);
  const [lyric, setLyric] = useState<LyricType | null>(null);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [currentCharIdx, setCurrentCharIdx] = useState(0);
  const [editingLine, setEditingLine] = useState<number | null>(null);
  const [editingWord, setEditingWord] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [flyHearts, setFlyHearts] = useState<number[]>([]);
  const [favoritesTotal, setFavoritesTotal] = useState(42);
  const [rhymeHighlights, setRhymeHighlights] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const typewriterTimerRef = useRef<number | null>(null);
  const placeholderTimerRef = useRef<number | null>(null);

  const moodConfig = MOOD_CONFIGS.find(m => m.key === mood)!;
  const placeholderTexts = moodConfig.placeholderTexts;

  useEffect(() => {
    const rotate = () => {
      setPlaceholderIdx(prev => (prev + 1) % placeholderTexts.length);
    };
    placeholderTimerRef.current = window.setInterval(rotate, placeholderHover ? 1500 : 4000);
    return () => {
      if (placeholderTimerRef.current) clearInterval(placeholderTimerRef.current);
    };
  }, [placeholderTexts, placeholderHover]);

  useEffect(() => {
    setPlaceholderIdx(0);
  }, [mood]);

  const handleMoodSelect = useCallback((m: Mood) => {
    setMood(m);
    const cfg = MOOD_CONFIGS.find(c => c.key === m)!;
    const randomScene = cfg.presetScenes[Math.floor(Math.random() * cfg.presetScenes.length)];
    setKeyword(randomScene);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!keyword.trim()) {
      inputRef.current?.focus();
      return;
    }
    
    setPhase('generating');
    
    try {
      let result: LyricType;
      try {
        result = await lyricApi.generate(keyword.trim(), mood);
      } catch {
        const generated = generateLyric(mood, keyword.trim());
        result = {
          id: uuidv4(),
          content: generated.content,
          mood,
          keyword: keyword.trim(),
          createdAt: Date.now(),
          favorites: Math.floor(Math.random() * 50),
          likes: Math.floor(Math.random() * 100),
          comments: [],
          rhymeWords: generated.rhymeWords,
        };
      }
      
      setLyric(result);
      setFavCount(result.favorites);
      setRhymeHighlights(getRhymeHighlightWords(result.content));
      setIsFavorited(false);
      setPhase('display');
      setDisplayedLines([]);
      setCurrentLineIdx(0);
      setCurrentCharIdx(0);
    } catch (err) {
      console.error(err);
      setPhase('input');
    }
  }, [keyword, mood]);

  useEffect(() => {
    if (phase !== 'display' || !lyric) return;

    const lines = lyric.content;
    
    const type