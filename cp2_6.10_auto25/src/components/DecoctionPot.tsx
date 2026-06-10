import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Flame, Wind } from 'lucide-react';
import { useStore } from '../store/useStore';
import { savePrescription } from '../services/api';
import { calculateTotalGrams } from '../utils/conversion';
import type { PlaybackFrame } from '../types';

const SOUP_START_COLOR = '#f0d080';
const SOUP_END_COLOR = '#5c3a1a';
const TOTAL_DECOCTION_TIME = 1800;
const WUHuo_DURATION = 600;

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 240, g: 208, b: 128 };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const interpolateColor = (startHex: string, endHex: string, progress: number): string => {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);
  const r = Math.round(start.r + (end.r - start.r) * progress);
  const g = Math.round(start.g + (end.g - start.g) * progress);
  const b = Math.round(start.b + (end.b - start.b) * progress);
  return rgbToHex(r, g, b);
};

const DecoctionPot: React.FC = () => {
  const {
    prescriptionItems,
    decoctionState,
    setDecoctionState,
    startDecoction,
    addPlaybackFrame,
    resetDecoctionState,
    addPrescription,
    isPlaybackMode,
    playbackIndex,
    setPlaybackIndex,
    selectedPrescription,
    resetAll,
  } = useStore();

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const framesRef = useRef<PlaybackFrame[]>([]);
  const [fps, setFps] = useState(0);
  const fpsCounterRef = useRef({ count: 0, lastTime: 0 });

  const [waterAmount, setWaterAmount] = useState(500);

  const hasConflicts = prescriptionItems.some(item => item.hasConflict);
  const canStart = prescriptionItems.length > 0 && !hasConflicts && !decoctionState.isDecocting && !isPlaybackMode;

  const updateDecoction = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp;
    }

    const delta = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    fpsCounterRef.current.count++;
    if (timestamp - fpsCounterRef.current.lastTime >= 1000) {
      setFps(fpsCounterRef.current.count);
      fpsCounterRef.current.count = 0;
      fpsCounterRef.current.lastTime = timestamp;
    }

    setDecoctionState((prev: typeof decoctionState) => {
      if (!prev.isDecocting || prev.currentPhase === '完成') {
        return prev;
      }

      const newTime = prev.currentTime + delta;
      let newPhase = prev.currentPhase;
      
      if (newTime >= WUHuo_DURATION && prev.currentPhase === '武火') {
        newPhase = '文火';
      }
      
      if (newTime >= TOTAL_DECOCTION_TIME) {
        const frame: PlaybackFrame = {
          time: TOTAL_DECOCTION_TIME,
          waterLevel: Math.max(50, prev.initialWaterLevel * 0.4),
          soupColor: SOUP_END_COLOR,
          sedimentLevel: 25,
          phase: '完成',
        };
        addPlaybackFrame(frame);
        framesRef.current.push(frame);
        
        return {
          ...prev,
          currentTime: TOTAL_DECOCTION_TIME,
          currentPhase: '完成',
          isDecocting: false,
          waterLevel: frame.waterLevel,
          soupColor: frame.soupColor,
          sedimentLevel: frame.sedimentLevel,
        };
      }

      const progress = newTime / TOTAL_DECOCTION_TIME;
      const evaporationRate = prev.currentPhase === '武火' ? 0.3 : 0.15;
      const newWaterLevel = Math.max(50, prev.initialWaterLevel - (prev.initialWaterLevel * evaporationRate * (delta / 60)));
      const newSoupColor = interpolateColor(SOUP_START_COLOR, SOUP_END_COLOR, progress);
      const newSedimentLevel = Math.min(25, progress * 25);

      const frame: PlaybackFrame = {
        time: newTime,
        waterLevel: newWaterLevel,
        soupColor: newSoupColor,
        sedimentLevel: newSedimentLevel,
        phase: newPhase as '武火' | '文火' | '完成',
      };
      
      framesRef.current.push(frame);
      if (framesRef.current.length % 10 === 0) {
        addPlaybackFrame(frame);
      }

      return {
        ...prev,
        currentTime: newTime,
        currentPhase: newPhase as '武火' | '文火' | '完成',
        waterLevel: newWaterLevel,
        soupColor: newSoupColor,
        sedimentLevel: newSedimentLevel,
      };
    });

    animationRef.current = requestAnimationFrame(updateDecoction);
  }, [setDecoctionState, addPlaybackFrame]);

  useEffect(() => {
    if (decoctionState.isDecocting) {
      lastTimeRef.current = 0;
      framesRef.current = [];
      animationRef.current = requestAnimationFrame(updateDecoction);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [decoctionState.isDecocting, updateDecoction]);

  useEffect(() => {
    if (decoctionState.currentPhase === '完成' && !isPlaybackMode) {
      const saveRecord = async () => {
        try {
          const totalGrams = calculateTotalGrams(prescriptionItems);
          const prescription = await savePrescription({
            items: prescriptionItems,
            totalDosage: totalGrams,
            decoctionParams: {
              initialWater: waterAmount,
              mode: 'standard',
            },
            playbackData: framesRef.current,
          });
          addPrescription(prescription);
        } catch (err) {
          console.error('保存处方失败', err);
        }
      };
      saveRecord();
    }
  }, [decoctionState.currentPhase, isPlaybackMode, prescriptionItems, waterAmount, addPrescription]);

  useEffect(() => {
    if (isPlaybackMode && selectedPrescription?.playbackData) {
      const frames = selectedPrescription.playbackData;
      if (playbackIndex < frames.length) {
        const timer = setTimeout(() => {
          const frame = frames[playbackIndex];
          setDecoctionState({
            isDecocting: false,
            currentPhase: frame.phase === '完成' ? '完成' : frame.phase,
            currentTime: frame.time,
            totalTime: TOTAL_DECOCTION_TIME,
            waterLevel: frame.waterLevel,
            initialWaterLevel: selectedPrescription.decoctionParams.initialWater,
            soupColor: frame.soupColor,
            sedimentLevel: frame.sedimentLevel,
            playbackFrames: frames,
          });
          setPlaybackIndex(playbackIndex + 1);
        }, 1000 / 1.5);
        return () => clearTimeout(timer);
      }
    }
  }, [isPlaybackMode, playbackIndex, selectedPrescription, setDecoctionState, setPlaybackIndex]);

  const handleStart = () => {
    if (!canStart) return;
    startDecoction(waterAmount);
  };

  const handleReset = () => {
    if (isPlaybackMode) {
      resetAll();
    } else {
      resetDecoctionState();
    }
    framesRef.current = [];
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const waterLevelPercent = decoctionState.initialWaterLevel > 0
    ? (decoctionState.waterLevel / decoctionState.initialWaterLevel) * 100
    : 0;

  const potHeight = 200;
  const waterHeight = (waterLevelPercent / 100) * (potHeight - 40);
  const sedimentHeight = (decoctionState.sedimentLevel / 100) * (potHeight - 40);

  const bubbleCount = decoctionState.isDecocting || isPlaybackMode ? 5 : 0;

  return (
    <div className="flex flex-col items-center h-full">
      <h2 className="brush-font text-2xl text-[#5d3a1a] mb-4">砂锅煎熬</h2>

      <div className="relative mb-6">
        <div className="pot-body rounded-full w-64 h-56 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-5 bg-[#3a3a2a] rounded-t-full"></div>
          
          <div
            className="absolute bottom-5 left-4 right-4 rounded-full transition-all duration-100"
            style={{
              height: waterHeight,
              backgroundColor: decoctionState.soupColor,
              opacity: 0.9,
              boxShadow: `inset 0 -10px 20px rgba(0,0,0,0.3)`,
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-white to-transparent opacity-20 rounded-t-full"></div>
            
            {Array.from({ length: bubbleCount }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full opacity-40"
                style={{
                  left: `${20 + i * 15}%`,
                  bottom: '10%',
                }}
                animate={{
                  y: [-waterHeight + 20, -10],
                  opacity: [0.6, 0],
                  scale: [1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>

          <div
            className="absolute bottom-5 left-4 right-4 bg-gradient-to-t from-[#3a2a1a] to-transparent rounded-b-full transition-all duration-1000"
            style={{
              height: sedimentHeight,
              opacity: 0.8,
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-[#2a1a0a] rounded-full"
                style={{
                  left: `${10 + i * 12}%`,
                  bottom: `${Math.random() * 30}%`,
                }}
                animate={{
                  y: [0, -3, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-8 h-16 pot-body rounded-l-full"></div>
          <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-8 h-16 pot-body rounded-r-full"></div>
          
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-56 h-1 bg-[#d4a574] opacity-30 rounded-full"></div>
        </div>

        {decoctionState.isDecocting && (
          <motion.div
            className="absolute -top-8 left-1/2 -translate-x-1/2"
            animate={{ opacity: [0.3, 0.8, 0.3], y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-white rounded-full opacity-40"></div>
              <div className="w-4 h-4 bg-white rounded-full opacity-30"></div>
              <div className="w-3 h-3 bg-white rounded-full opacity-40"></div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="paper-texture rounded-lg p-4 w-full max-w-xs">
        <div className="text-center mb-4">
          {decoctionState.currentPhase === 'idle' && !isPlaybackMode && (
            <span className="brush-font text-xl text-[#8b5a2b]">待煎熬</span>
          )}
          {decoctionState.currentPhase === '武火' && (
            <span className="brush-font text-xl text-[#b22222] flex items-center justify-center gap-2">
              <Flame size={20} className="animate-pulse" />
              武火煎煮中
            </span>
          )}
          {decoctionState.currentPhase === '文火' && (
            <span className="brush-font text-xl text-[#8b4513] flex items-center justify-center gap-2">
              <Wind size={20} className="animate-pulse" />
              文火慢熬中
            </span>
          )}
          {decoctionState.currentPhase === '完成' && (
            <span className="brush-font text-xl text-[#5a7a5a]">
              药汤已煎成，请倒入药碗
            </span>
          )}
          {isPlaybackMode && (
            <span className="brush-font text-xl text-[#6b4e3a]">
              回放中... {Math.floor((playbackIndex / (selectedPrescription?.playbackData?.length || 1)) * 100)}%
            </span>
          )}
        </div>

        {decoctionState.currentPhase !== 'idle' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-[#6b4e3a] mb-1">
              <span>{formatTime(decoctionState.currentTime)}</span>
              <span>{formatTime(TOTAL_DECOCTION_TIME)}</span>
            </div>
            <div className="h-2 bg-[#d4c4a8] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#b22222] to-[#8b4513]"
                initial={{ width: 0 }}
                animate={{ width: `${(decoctionState.currentTime / TOTAL_DECOCTION_TIME) * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <div className="flex justify-between text-xs text-[#8b5a2b] mt-1">
              <span>武火 10分钟</span>
              <span>文火 20分钟</span>
            </div>
          </div>
        )}

        {decoctionState.currentPhase === 'idle' && !isPlaybackMode && (
          <div className="mb-4">
            <label className="block text-sm text-[#8b5a2b] mb-2">
              加水量：{waterAmount}ml
            </label>
            <input
              type="range"
              min="200"
              max="1000"
              step="50"
              value={waterAmount}
              onChange={(e) => setWaterAmount(parseInt(e.target.value))}
              className="w-full accent-[#b22222]"
            />
            <div className="flex justify-between text-xs text-[#8b5a2b] mt-1">
              <span>200ml</span>
              <span>1000ml</span>
            </div>
          </div>
        )}

        {decoctionState.currentPhase !== 'idle' && (
          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
            <div className="text-center p-2 bg-white bg-opacity-30 rounded">
              <div className="text-[#8b5a2b]">剩余水量</div>
              <div className="text-[#5d3a1a] font-bold">{Math.round(decoctionState.waterLevel)}ml</div>
            </div>
            <div className="text-center p-2 bg-white bg-opacity-30 rounded">
              <div className="text-[#8b5a2b]">汤色</div>
              <div
                className="w-6 h-6 rounded mx-auto mt-1 border border-[#d4a574]"
                style={{ backgroundColor: decoctionState.soupColor }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {decoctionState.currentPhase === 'idle' && !isPlaybackMode && (
            <>
              <button
                className="flex-1 btn-ancient py-2 rounded flex items-center justify-center gap-2"
                onClick={handleStart}
                disabled={!canStart}
              >
                <Play size={18} />
                开始煎熬
              </button>
              {hasConflicts && (
                <p className="text-xs text-[#cc0000] text-center mt-2 w-full">
                  药方存在配伍禁忌，请调整后再煎熬
                </p>
              )}
            </>
          )}
          
          {(decoctionState.currentPhase === '完成' || isPlaybackMode) && (
            <button
              className="flex-1 btn-ancient py-2 rounded flex items-center justify-center gap-2"
              onClick={handleReset}
            >
              <RotateCcw size={18} />
              重新开始
            </button>
          )}
        </div>

        {fps > 0 && (
          <div className="text-xs text-[#8b5a2b] text-center mt-2 opacity-60">
            帧率：{fps} FPS
          </div>
        )}
      </div>

      {decoctionState.currentPhase === '完成' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center"
        >
          <div className="porcelain-bowl w-10 h-6 rounded-b-full mx-auto relative">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#4a6a4a] rounded-t-full"></div>
            <div
              className="absolute top-1 left-1 right-1 h-2 rounded-full"
              style={{ backgroundColor: decoctionState.soupColor }}
            />
          </div>
          <p className="brush-font text-lg text-[#5a7a5a] mt-2">青瓷药碗</p>
        </motion.div>
      )}
    </div>
  );
};

export default DecoctionPot;
