import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { PuppetCharacter, ControlPoint, ControlFrame, PerformanceRecord, CHARACTER_TEMPLATES, CharacterRole } from './types';
import { initializeCharacter } from './components/CharacterRig';
import ShadowStage from './components/ShadowStage';
import ControlPanel from './components/ControlPanel';
import { playBambooClick } from './utils/audioUtils';

const App: React.FC = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  
  const [characters, setCharacters] = useState<PuppetCharacter[]>(() => {
    return CHARACTER_TEMPLATES.map(template => 
      initializeCharacter(template.name, template.role)
    );
  });
  
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([
    {
      id: uuidv4(),
      characterId: null,
      sequence: [],
      isRecording: false,
      isPlaying: false,
      startTime: 0,
      duration: 0,
      name: '控制点 1',
    },
  ]);
  
  const [lampBrightness, setLampBrightness] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [performanceStartTime, setPerformanceStartTime] = useState<number | null>(null);
  const [performanceEndTime, setPerformanceEndTime] = useState<number | null>(null);
  const [performanceRecords, setPerformanceRecords] = useState<PerformanceRecord[]>([]);
  const [scrollExpanded, setScrollExpanded] = useState(false);
  
  const charactersByRole = useMemo(() => {
    const roles: CharacterRole[] = ['生', '旦', '净', '丑'];
    const grouped: Record<CharacterRole, PuppetCharacter[]> = {
      '生': [],
      '旦': [],
      '净': [],
      '丑': [],
    };
    
    characters.forEach(char => {
      if (!char.isOnStage) {
        grouped[char.role].push(char);
      }
    });
    
    return roles.map(role => ({ role, characters: grouped[role] }));
  }, [characters]);
  
  const handleJointChange = useCallback((characterId: string, jointId: string, angle: number) => {
    setCharacters(prev => prev.map(char => {
      if (char.id !== characterId) return char;
      return {
        ...char,
        joints: char.joints.map(joint => 
          joint.id === jointId ? { ...joint, angle } : joint
        ),
      };
    }));
  }, []);
  
  const handlePositionChange = useCallback((characterId: string, x: number, y: number) => {
    setCharacters(prev => prev.map(char => 
      char.id === characterId 
        ? { ...char, position: { x, y } }
        : char
    ));
  }, []);
  
  const handleCharacterDrop = useCallback((characterId: string, x: number, y: number) => {
    setCharacters(prev => prev.map(char => 
      char.id === characterId 
        ? { ...char, position: { x, y }, isOnStage: true }
        : char
    ));
  }, []);
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, characterId: string) => {
    e.dataTransfer.setData('characterId', characterId);
    playBambooClick();
  };
  
  const handlePlayback = useCallback((characterId: string, frame: ControlFrame) => {
    setCharacters(prev => prev.map(char => {
      if (char.id !== characterId) return char;
      
      const newJoints = char.joints.map(joint => {
        const recordedAngle = frame.jointAngles[joint.id];
        return recordedAngle !== undefined 
          ? { ...joint, angle: recordedAngle }
          : joint;
      });
      
      return {
        ...char,
        position: frame.position,
        joints: newJoints,
      };
    }));
  }, []);
  
  const handlePlayStart = useCallback(() => {
    setIsPlaying(true);
    setPerformanceStartTime(Date.now());
    
    const records: PerformanceRecord[] = controlPoints
      .filter(p => p.characterId && p.sequence.length > 0)
      .map((p, index) => {
        const char = characters.find(c => c.id === p.characterId);
        return {
          characterId: p.characterId!,
          characterName: char?.name || '未知',
          entryOrder: index + 1,
          actionDuration: p.duration,
        };
      });
    setPerformanceRecords(records);
  }, [controlPoints, characters]);
  
  const handlePlayStop = useCallback(() => {
    setIsPlaying(false);
    setPerformanceEndTime(Date.now());
    setShowScroll(true);
  }, []);
  
  const handleBrightnessChange = useCallback((value: number) => {
    setLampBrightness(value);
  }, []);
  
  const savePerformanceImage = useCallback(async () => {
    playBambooClick();
    
    if (!stageRef.current) return;
    
    try {
      const canvas = await html2canvas(stageRef.current, {
        backgroundColor: '#3e2723',
        scale: 2,
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `皮影戏_三打白骨精_${Date.now()}.png`);
        }
      });
    } catch (error) {
      console.error('保存图片失败:', error);
    }
  }, []);
  
  const totalPerformanceTime = useMemo(() => {
    if (!performanceStartTime || !performanceEndTime) return 0;
    return performanceEndTime - performanceStartTime;
  }, [performanceStartTime, performanceEndTime]);
  
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };
  
  const removeFromStage = (characterId: string) => {
    playBambooClick();
    setCharacters(prev => prev.map(char => 
      char.id === characterId 
        ? { ...char, isOnStage: false, position: { x: 400, y: 300 } }
        : char
    ));
  };
  
  return (
    <div 
      className="min-h-screen w-full overflow-auto"
      style={{ backgroundColor: '#4e342e' }}
    >
      <div className="flex flex-col items-center p-6 gap-6">
        <h1 
          className="text-4xl mb-2"
          style={{ 
            color: '#d7ccc8', 
            textShadow: '3px 3px 6px rgba(0,0,0,0.5)',
            letterSpacing: '8px',
          }}
        >
          皮影戏坊
        </h1>
        
        <div className="stage-container flex gap-6 items-start flex-wrap justify-center">
          <div 
            className="burned-edge p-4 scroll-pattern"
            style={{ 
              backgroundColor: '#d7ccc8',
              width: '180px',
            }}
          >
            <h3 
              className="text-xl text-center mb-4 pb-2"
              style={{ 
                color: '#3e2723',
                borderBottom: '2px solid #7cb342',
              }}
            >
              皮影人物架
            </h3>
            
            {charactersByRole.map(({ role, characters: roleChars }) => (
              <div key={role} className="mb-4">
                <div 
                  className="text-lg text-center py-1 px-2 rounded mb-2"
                  style={{
                    backgroundColor: '#7cb342',
                    color: '#fff',
                    border: '2px solid #558b2f',
                  }}
                >
                  {role}
                </div>
                <div className="flex flex-col gap-2">
                  {roleChars.map(char => (
                    <div
                      key={char.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, char.id)}
                      className="p-2 rounded cursor-grab active:cursor-grabbing transition-transform hover:scale-105 active:scale-98"
                      style={{
                        backgroundColor: '#fff8e1',
                        border: '2px solid #8d6e63',
                        fontSize: '16px',
                        color: '#3e2723',
                        textAlign: 'center',
                      }}
                    >
                      {char.name}
                    </div>
                  ))}
                  {roleChars.length === 0 && (
                    <div 
                      className="p-2 text-center"
                      style={{ color: '#8d6e63', fontSize: '14px' }}
                    >
                      已上场
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <ShadowStage
            characters={characters}
            lampBrightness={lampBrightness}
            isPlaying={isPlaying}
            onJointChange={handleJointChange}
            onPositionChange={handlePositionChange}
            onCharacterDrop={handleCharacterDrop}
            stageRef={stageRef}
          />
          
          <div 
            className="burned-edge p-4 scroll-pattern"
            style={{ 
              backgroundColor: '#d7ccc8',
              width: '180px',
            }}
          >
            <h3 
              className="text-xl text-center mb-4 pb-2"
              style={{ 
                color: '#3e2723',
                borderBottom: '2px solid #7cb342',
              }}
            >
              场上角色
            </h3>
            
            <div className="flex flex-col gap-2">
              {characters.filter(c => c.isOnStage).map(char => (
                <div
                  key={char.id}
                  className="flex items-center justify-between p-2 rounded"
                  style={{
                    backgroundColor: '#fff8e1',
                    border: '2px solid #8d6e63',
                  }}
                >
                  <span style={{ color: '#3e2723' }}>{char.name}</span>
                  {!isPlaying && (
                    <button
                      onClick={() => removeFromStage(char.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      下场
                    </button>
                  )}
                </div>
              ))}
              {characters.filter(c => c.isOnStage).length === 0 && (
                <div 
                  className="p-2 text-center"
                  style={{ color: '#8d6e63', fontSize: '14px' }}
                >
                  拖拽角色到幕布
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div style={{ width: '100%', maxWidth: '1200px' }}>
          <ControlPanel
            characters={characters}
            controlPoints={controlPoints}
            onControlPointsChange={setControlPoints}
            onPlayback={handlePlayback}
            onPlayStart={handlePlayStart}
            onPlayStop={handlePlayStop}
            isPlaying={isPlaying}
            onBrightnessChange={handleBrightnessChange}
            lampBrightness={lampBrightness}
          />
        </div>
      </div>
      
      <AnimatePresence>
        {showScroll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            onClick={() => setShowScroll(false)}
          >
            <motion.div
              initial={{ scale: 0.8, rotateX: -30 }}
              animate={{ scale: 1, rotateX: 0 }}
              exit={{ scale: 0.8, rotateX: 30 }}
              className="scroll-pattern burned-edge p-8 max-w-2xl w-full mx-4"
              style={{ 
                backgroundColor: '#fff8e1',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <h2 
                  className="text-4xl mb-2"
                  style={{ color: '#3e2723', letterSpacing: '6px' }}
                >
                  三打白骨精
                </h2>
                <div 
                  className="h-1 w-48 mx-auto"
                  style={{ backgroundColor: '#8d6e63' }}
                />
              </div>
              
              <button
                onClick={() => setScrollExpanded(!scrollExpanded)}
                className="w-full text-left mb-4 bamboo-btn p-3 rounded"
                style={{
                  backgroundColor: '#efebe9',
                  border: '2px solid #8d6e63',
                  color: '#3e2723',
                  fontSize: '20px',
                }}
              >
                {scrollExpanded ? '▼ 收起详情' : '▶ 展开演出详情'}
              </button>
              
              <AnimatePresence>
                {scrollExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 mb-6">
                      <div className="text-xl" style={{ color: '#5d4037' }}>
                        <strong>剧目名称：</strong>三打白骨精
                      </div>
                      <div className="text-xl" style={{ color: '#5d4037' }}>
                        <strong>总表演时长：</strong>{formatDuration(totalPerformanceTime)}
                      </div>
                      
                      <div>
                        <h3 className="text-2xl mb-3" style={{ color: '#3e2723' }}>
                          角色出场顺序
                        </h3>
                        <div className="space-y-2">
                          {performanceRecords.map((record, index) => (
                            <motion.div
                              key={record.characterId}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex justify-between items-center p-3 rounded"
                              style={{
                                backgroundColor: '#efebe9',
                                borderLeft: `4px solid ${['#d32f2f', '#fbc02d', '#689f38'][index % 3]}`,
                              }}
                            >
                              <span className="text-xl" style={{ color: '#3e2723' }}>
                                第{record.entryOrder}位：{record.characterName}
                              </span>
                              <span className="text-lg" style={{ color: '#5d4037' }}>
                                动作时长：{(record.actionDuration / 1000).toFixed(1)}秒
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-xl" style={{ color: '#5d4037' }}>
                        <strong>参演角色总数：</strong>{performanceRecords.length}位
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex gap-4 justify-center mt-6">
                <button
                  onClick={savePerformanceImage}
                  className="bamboo-btn px-8 py-3 rounded text-xl"
                  style={{
                    background: 'linear-gradient(to bottom, #8bc34a, #689f38)',
                    color: '#fff',
                    border: '3px solid #33691e',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                  }}
                >
                  📷 保存演出画面
                </button>
                <button
                  onClick={() => {
                    playBambooClick();
                    setShowScroll(false);
                  }}
                  className="bamboo-btn px-8 py-3 rounded text-xl"
                  style={{
                    background: 'linear-gradient(to bottom, #90a4ae, #546e7a)',
                    color: '#fff',
                    border: '3px solid #37474f',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                  }}
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
