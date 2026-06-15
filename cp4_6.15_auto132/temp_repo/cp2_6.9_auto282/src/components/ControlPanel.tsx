import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { ControlPoint, PuppetCharacter, ControlFrame } from '../types';
import { playBambooClick, playDrumPattern } from '../utils/audioUtils';

interface ControlPanelProps {
  characters: PuppetCharacter[];
  controlPoints: ControlPoint[];
  onControlPointsChange: (points: ControlPoint[]) => void;
  onPlayback: (characterId: string, frame: ControlFrame) => void;
  onPlayStart: () => void;
  onPlayStop: () => void;
  isPlaying: boolean;
  onBrightnessChange: (value: number) => void;
  lampBrightness: number;
}

const SHADOW_PUPPET_FPS = 12;
const MAX_RECORD_DURATION = 30000;
const SAMPLE_RATE = 60;

const ControlPanel: React.FC<ControlPanelProps> = ({
  characters,
  controlPoints,
  onControlPointsChange,
  onPlayback,
  onPlayStart,
  onPlayStop,
  isPlaying,
  onBrightnessChange,
  lampBrightness,
}) => {
  const recordingRef = useRef<{ pointId: string; startTime: number; animationFrame: number } | null>(null);
  const playbackRef = useRef<{ startTime: number; animationFrame: number; drumPlayer: { stop: () => void } } | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  
  const getCharacterState = useCallback((characterId: string): ControlFrame | null => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return null;
    
    const jointAngles: Record<string, number> = {};
    character.joints.forEach(joint => {
      jointAngles[joint.id] = joint.angle;
    });
    
    return {
      timestamp: Date.now(),
      position: { ...character.position },
      jointAngles,
    };
  }, [characters]);
  
  const startRecording = useCallback((pointId: string) => {
    playBambooClick();
    
    const point = controlPoints.find(p => p.id === pointId);
    if (!point || !point.characterId) return;
    
    const newPoints = controlPoints.map(p => 
      p.id === pointId 
        ? { ...p, isRecording: true, sequence: [], startTime: Date.now() }
        : p
    );
    onControlPointsChange(newPoints);
    
    const startTime = Date.now();
    let lastSampleTime = 0;
    
    const recordFrame = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      if (elapsed >= MAX_RECORD_DURATION) {
        stopRecording(pointId);
        return;
      }
      
      if (now - lastSampleTime >= 1000 / SAMPLE_RATE) {
        const state = getCharacterState(point.characterId!);
        if (state) {
          const updatedPoints = controlPoints.map(p => {
            if (p.id === pointId && p.isRecording) {
              return {
                ...p,
                sequence: [...p.sequence, { ...state, timestamp: elapsed }],
                duration: elapsed,
              };
            }
            return p;
          });
          onControlPointsChange(updatedPoints);
          lastSampleTime = now;
        }
      }
      
      const animationId = requestAnimationFrame(recordFrame);
      recordingRef.current = { pointId, startTime, animationFrame: animationId };
    };
    
    recordFrame();
  }, [controlPoints, onControlPointsChange, getCharacterState]);
  
  const stopRecording = useCallback((pointId: string) => {
    playBambooClick();
    
    if (recordingRef.current) {
      cancelAnimationFrame(recordingRef.current.animationFrame);
      recordingRef.current = null;
    }
    
    const newPoints = controlPoints.map(p => 
      p.id === pointId 
        ? { ...p, isRecording: false }
        : p
    );
    onControlPointsChange(newPoints);
  }, [controlPoints, onControlPointsChange]);
  
  const startPlayback = useCallback(() => {
    playBambooClick();
    onPlayStart();
    
    const drumPlayer = playDrumPattern(60000);
    const startTime = Date.now();
    lastFrameTimeRef.current = 0;
    
    const playbackFrame = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      const frameInterval = 1000 / SHADOW_PUPPET_FPS;
      
      if (elapsed - lastFrameTimeRef.current >= frameInterval) {
        controlPoints.forEach(point => {
          if (!point.characterId || point.sequence.length === 0) return;
          
          const frameIndex = Math.floor(elapsed / (1000 / SAMPLE_RATE)) % point.sequence.length;
          const frame = point.sequence[frameIndex];
          
          if (frame) {
            onPlayback(point.characterId, frame);
          }
        });
        
        lastFrameTimeRef.current = elapsed;
      }
      
      const maxDuration = Math.max(...controlPoints.map(p => p.duration), 60000);
      if (elapsed >= maxDuration) {
        stopPlayback();
        return;
      }
      
      const animationId = requestAnimationFrame(playbackFrame);
      playbackRef.current = { startTime, animationFrame: animationId, drumPlayer };
    };
    
    playbackFrame();
  }, [controlPoints, onPlayback, onPlayStart]);
  
  const stopPlayback = useCallback(() => {
    playBambooClick();
    
    if (playbackRef.current) {
      cancelAnimationFrame(playbackRef.current.animationFrame);
      playbackRef.current.drumPlayer.stop();
      playbackRef.current = null;
    }
    
    onPlayStop();
  }, [onPlayStop]);
  
  const assignCharacter = useCallback((pointId: string, characterId: string | null) => {
    playBambooClick();
    
    const newPoints = controlPoints.map(p => 
      p.id === pointId 
        ? { ...p, characterId, sequence: [], duration: 0 }
        : p
    );
    onControlPointsChange(newPoints);
  }, [controlPoints, onControlPointsChange]);
  
  const addControlPoint = useCallback(() => {
    if (controlPoints.length >= 3) return;
    
    playBambooClick();
    
    const newPoint: ControlPoint = {
      id: uuidv4(),
      characterId: null,
      sequence: [],
      isRecording: false,
      isPlaying: false,
      startTime: 0,
      duration: 0,
      name: `控制点 ${controlPoints.length + 1}`,
    };
    
    onControlPointsChange([...controlPoints, newPoint]);
  }, [controlPoints, onControlPointsChange]);
  
  const removeControlPoint = useCallback((pointId: string) => {
    playBambooClick();
    onControlPointsChange(controlPoints.filter(p => p.id !== pointId));
  }, [controlPoints, onControlPointsChange]);
  
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        cancelAnimationFrame(recordingRef.current.animationFrame);
      }
      if (playbackRef.current) {
        cancelAnimationFrame(playbackRef.current.animationFrame);
        playbackRef.current.drumPlayer.stop();
      }
    };
  }, []);
  
  const availableCharacters = characters.filter(c => 
    c.isOnStage && !controlPoints.some(p => p.characterId === c.id)
  );
  
  return (
    <div className="flex flex-col gap-6 p-6" style={{ width: '100%' }}>
      <div 
        className="burned-edge p-4 scroll-pattern"
        style={{ backgroundColor: '#d7ccc8' }}
      >
        <h3 className="text-2xl mb-4" style={{ color: '#3e2723' }}>灯光控制</h3>
        <div className="flex items-center gap-4">
          <span style={{ color: '#5d4037' }}>油灯亮度</span>
          <input
            type="range"
            min="0.3"
            max="1.8"
            step="0.1"
            value={lampBrightness}
            onChange={(e) => onBrightnessChange(parseFloat(e.target.value))}
            className="bamboo-slider flex-1"
          />
          <span style={{ color: '#5d4037', minWidth: '40px' }}>{lampBrightness.toFixed(1)}</span>
        </div>
      </div>
      
      <div 
        className="burned-edge p-4 scroll-pattern"
        style={{ backgroundColor: '#d7ccc8' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl" style={{ color: '#3e2723' }}>操作轨道</h3>
          <button
            onClick={addControlPoint}
            disabled={controlPoints.length >= 3 || isPlaying}
            className="bamboo-btn px-4 py-2 rounded disabled:opacity-50"
            style={{
              background: 'linear-gradient(to bottom, #8bc34a, #689f38)',
              color: '#fff',
              border: '2px solid #33691e',
              boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
            }}
          >
            + 添加控制点
          </button>
        </div>
        
        <div className="control-track flex gap-6 items-start flex-wrap">
          {controlPoints.map((point, index) => {
            const assignedCharacter = characters.find(c => c.id === point.characterId);
            const isRecording = point.isRecording;
            
            return (
              <motion.div
                key={point.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-3 p-4 rounded"
                style={{
                  backgroundColor: '#efebe9',
                  border: '3px solid #7cb342',
                  minWidth: '200px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xl" style={{ color: '#33691e' }}>
                    {point.name}
                  </span>
                  {!isPlaying && (
                    <button
                      onClick={() => removeControlPoint(point.id)}
                      className="text-red-600 hover:text-red-800 text-xl"
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                <select
                  value={point.characterId || ''}
                  onChange={(e) => assignCharacter(point.id, e.target.value || null)}
                  disabled={isPlaying || isRecording}
                  className="p-2 rounded border-2"
                  style={{
                    borderColor: '#7cb342',
                    backgroundColor: '#fff8e1',
                    fontFamily: "'Ma Shan Zheng', cursive",
                    fontSize: '16px',
                  }}
                >
                  <option value="">选择角色...</option>
                  {assignedCharacter && (
                    <option value={assignedCharacter.id}>
                      {assignedCharacter.name} ({assignedCharacter.role})
                    </option>
                  )}
                  {availableCharacters.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.role})
                    </option>
                  ))}
                </select>
                
                {point.characterId && (
                  <>
                    <div className="text-sm" style={{ color: '#5d4037' }}>
                      时长: {point.duration > 0 ? `${(point.duration / 1000).toFixed(1)}s` : '未录制'}
                    </div>
                    
                    <div className="flex gap-2">
                      {!isRecording ? (
                        <button
                          onClick={() => startRecording(point.id)}
                          disabled={isPlaying}
                          className="bamboo-btn flex-1 px-3 py-2 rounded disabled:opacity-50"
                          style={{
                            background: 'linear-gradient(to bottom, #ef5350, #c62828)',
                            color: '#fff',
                            border: '2px solid #b71c1c',
                          }}
                        >
                          ⏺ 录制
                        </button>
                      ) : (
                        <button
                          onClick={() => stopRecording(point.id)}
                          className="bamboo-btn flex-1 px-3 py-2 rounded"
                          style={{
                            background: 'linear-gradient(to bottom, #66bb6a, #2e7d32)',
                            color: '#fff',
                            border: '2px solid #1b5e20',
                          }}
                        >
                          ⏹ 停止
                        </button>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
      
      <div 
        className="burned-edge p-4 scroll-pattern flex gap-4 justify-center"
        style={{ backgroundColor: '#d7ccc8' }}
      >
        {!isPlaying ? (
          <button
            onClick={startPlayback}
            disabled={controlPoints.every(p => p.sequence.length === 0)}
            className="bamboo-btn px-8 py-3 rounded text-xl disabled:opacity-50"
            style={{
              background: 'linear-gradient(to bottom, #ff9800, #f57c00)',
              color: '#fff',
              border: '3px solid #e65100',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            }}
          >
            ▶ 开始表演
          </button>
        ) : (
          <button
            onClick={stopPlayback}
            className="bamboo-btn px-8 py-3 rounded text-xl"
            style={{
              background: 'linear-gradient(to bottom, #ef5350, #c62828)',
              color: '#fff',
              border: '3px solid #b71c1c',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            }}
          >
            ⏹ 结束表演
          </button>
        )}
      </div>
      
      <style>{`
        @media (max-width: 768px) {
          .control-track {
            flex-direction: column;
            gap: 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ControlPanel;
