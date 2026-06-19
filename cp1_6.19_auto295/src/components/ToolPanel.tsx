import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGalleryStore } from '../store/galleryStore';
import { snapToGrid, FLOOR_GRID_SIZE, GALLERY_DIMENSIONS, WALL_GRID_SIZE } from '../utils/helpers';
import type { WallType, SculptureType, LightType } from '../types';

const COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#34495E', '#E67E22'];

interface ToolPanelProps {
  onWallClickRequest?: (wall: WallType, pos: { x: number; y: number; z: number }) => void;
}

export function ToolPanel({ onWallClickRequest }: ToolPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [panelTop, setPanelTop] = useState(24);
  const [isDragging, setIsDragging] = useState(false);
  const [sculptureColor, setSculptureColor] = useState('#95A5A6');
  const [selectedSculptureType, setSelectedSculptureType] = useState<SculptureType>('sphere');
  const [lightColor, setLightColor] = useState('#FFFFFF');
  const [lightIntensity, setLightIntensity] = useState(1.5);
  const [lightAngle, setLightAngle] = useState(30);
  const [selectedLightType, setSelectedLightType] = useState<LightType>('spot');
  const dragStartY = useRef(0);
  const dragStartTop = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addArtwork, addLight } = useGalleryStore();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartTop.current = panelTop;
  }, [panelTop]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientY - dragStartY.current;
    setPanelTop(Math.max(0, Math.min(window.innerHeight - 300, dragStartTop.current + delta)));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      const wall: WallType = 'north';
      const position = {
        x: snapToGrid(0, WALL_GRID_SIZE),
        y: snapToGrid(GALLERY_DIMENSIONS.height / 2, WALL_GRID_SIZE),
        z: -GALLERY_DIMENSIONS.depth / 2 + 0.03,
      };
      const rotation = { x: 0, y: 0, z: 0 };
      addArtwork({
        type: 'painting',
        position,
        rotation,
        imageUrl,
        wall,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addSculpture = () => {
    const position = {
      x: snapToGrid(0, FLOOR_GRID_SIZE),
      y: 0,
      z: snapToGrid(0, FLOOR_GRID_SIZE),
    };
    addArtwork({
      type: 'sculpture',
      position,
      rotation: { x: 0, y: 0, z: 0 },
      sculptureType: selectedSculptureType,
      color: sculptureColor,
    });
  };

  const addNewLight = () => {
    const position = { x: 0, y: 3.5, z: 0 };
    const target = { x: 0, y: 0, z: 0 };
    addLight({
      type: selectedLightType,
      position,
      target: selectedLightType === 'spot' ? target : undefined,
      color: lightColor,
      intensity: lightIntensity,
      angle: selectedLightType === 'spot' ? lightAngle : undefined,
      penumbra: 0.5,
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const panelWidth = isCollapsed ? 56 : 260;

  return (
    <>
      <motion.div
        drag={false}
        style={{
          position: 'fixed',
          left: 16,
          top: panelTop,
          width: panelWidth,
          zIndex: 1000,
          userSelect: isDragging ? 'none' : 'auto',
        }}
        animate={{ width: panelWidth }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
      >
        <div
          style={{
            background: 'rgba(44, 62, 80, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 12,
            color: '#FFFFFF',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {!isCollapsed && (
              <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: 0.5 }}>画廊工具</span>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4,
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isCollapsed ? '→' : '←'}
            </button>
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: 12 }}>
                  <ToolButton
                    icon="🖼"
                    label="添加画作"
                    isExpanded={expandedSection === 'painting'}
                    onToggle={() => toggleSection('painting')}
                  />
                  <AnimatePresence>
                    {expandedSection === 'painting' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '12px 8px 4px' }}>
                          <p style={{ fontSize: 12, color: '#B0BEC5', margin: '0 0 10px', lineHeight: 1.5 }}>
                            点击展厅任意墙面可快速上传画作，或使用下方按钮选择图片
                          </p>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              background: '#5D4037',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#6D4C41')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#5D4037')}
                          >
                            📁 选择图片上传
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <ToolButton
                    icon="🗿"
                    label="添加雕塑"
                    isExpanded={expandedSection === 'sculpture'}
                    onToggle={() => toggleSection('sculpture')}
                  />
                  <AnimatePresence>
                    {expandedSection === 'sculpture' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '12px 8px 4px' }}>
                          <p style={{ fontSize: 12, color: '#B0BEC5', margin: '0 0 10px' }}>选择雕塑样式</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                            {(['sphere', 'cube', 'cone', 'spiral'] as SculptureType[]).map((type) => (
                              <button
                                key={type}
                                onClick={() => setSelectedSculptureType(type)}
                                style={{
                                  padding: '10px 6px',
                                  background: selectedSculptureType === type ? '#5D4037' : 'rgba(255,255,255,0.06)',
                                  color: '#FFFFFF',
                                  border: selectedSculptureType === type ? '1px solid #8D6E63' : '1px solid transparent',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {type === 'sphere' && '◉ 球体'}
                                {type === 'cube' && '◼ 立方体'}
                                {type === 'cone' && '▲ 圆锥体'}
                                {type === 'spiral' && '➰ 螺旋体'}
                              </button>
                            ))}
                          </div>
                          <p style={{ fontSize: 12, color: '#B0BEC5', margin: '0 0 8px' }}>选择颜色</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                            {COLORS.map((color) => (
                              <button
                                key={color}
                                onClick={() => setSculptureColor(color)}
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: '50%',
                                  background: color,
                                  border: sculptureColor === color ? '2px solid #FFFFFF' : '2px solid transparent',
                                  cursor: 'pointer',
                                  padding: 0,
                                  boxShadow: sculptureColor === color ? '0 0 0 2px #5D4037' : 'none',
                                }}
                              />
                            ))}
                          </div>
                          <button
                            onClick={addSculpture}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              background: '#5D4037',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 500,
                              cursor: 'pointer',
                            }}
                          >
                            ➕ 添加雕塑到展厅
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <ToolButton
                    icon="💡"
                    label="添加光源"
                    isExpanded={expandedSection === 'light'}
                    onToggle={() => toggleSection('light')}
                  />
                  <AnimatePresence>
                    {expandedSection === 'light' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '12px 8px 4px' }}>
                          <p style={{ fontSize: 12, color: '#B0BEC5', margin: '0 0 10px' }}>选择光源类型</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                            {(['point', 'spot'] as LightType[]).map((type) => (
                              <button
                                key={type}
                                onClick={() => setSelectedLightType(type)}
                                style={{
                                  padding: '10px 6px',
                                  background: selectedLightType === type ? '#5D4037' : 'rgba(255,255,255,0.06)',
                                  color: '#FFFFFF',
                                  border: selectedLightType === type ? '1px solid #8D6E63' : '1px solid transparent',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  cursor: 'pointer',
                                }}
                              >
                                {type === 'point' && '🔴 点光源'}
                                {type === 'spot' && '🎯 射灯'}
                              </button>
                            ))}
                          </div>
                          <Slider
                            label="强度"
                            value={lightIntensity}
                            min={0.1}
                            max={5}
                            step={0.1}
                            onChange={setLightIntensity}
                          />
                          {selectedLightType === 'spot' && (
                            <Slider
                              label="光锥角度 (°)"
                              value={lightAngle}
                              min={5}
                              max={45}
                              step={1}
                              onChange={setLightAngle}
                            />
                          )}
                          <p style={{ fontSize: 12, color: '#B0BEC5', margin: '10px 0 8px' }}>选择色温</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                            {['#FF6B35', '#FFA07A', '#FFD700', '#FFF8DC', '#FFFFFF', '#ADD8E6', '#87CEEB'].map((color) => (
                              <button
                                key={color}
                                onClick={() => setLightColor(color)}
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: '50%',
                                  background: color,
                                  border: lightColor === color ? '2px solid #FFFFFF' : '2px solid transparent',
                                  cursor: 'pointer',
                                  padding: 0,
                                  boxShadow: lightColor === color ? '0 0 0 2px #5D4037' : 'none',
                                }}
                              />
                            ))}
                          </div>
                          <button
                            onClick={addNewLight}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              background: '#5D4037',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: 8,
                              fontSize: 13,
                              fontWeight: 500,
                              cursor: 'pointer',
                            }}
                          >
                            ➕ 添加光源到展厅
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

function ToolButton({
  icon,
  label,
  isExpanded,
  onToggle,
}: {
  icon: string;
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%',
        padding: '12px 14px',
        marginTop: 6,
        background: isExpanded ? 'rgba(93, 64, 55, 0.6)' : 'rgba(255,255,255,0.04)',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 14,
        fontWeight: 500,
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
      }}
      onMouseLeave={(e) => {
        if (!isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
      <span style={{ fontSize: 12, opacity: 0.6 }}>{isExpanded ? '−' : '+'}</span>
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#B0BEC5' }}>{label}</span>
        <span style={{ fontSize: 12, color: '#FFFFFF', fontWeight: 500 }}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#8D6E63' }}
      />
    </div>
  );
}
