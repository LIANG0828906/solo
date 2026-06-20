import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { InkRenderer } from '../engine/inkRenderer';

const CanvasArea: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<InkRenderer | null>(null);
  const [showInspiration, setShowInspiration] = useState(false);
  const [inspirationText, setInspirationText] = useState('');

  const {
    currentPoem,
    currentImagery,
    brushDensity,
    theme,
    animSpeed,
    isAnimating,
    isPaused,
    selectedImagery,
    annotations,
    showAnnotationInput,
    setIsPaused,
    addAnnotation,
    setShowAnnotationInput,
  } = useAppStore();

  const [annotationText, setAnnotationText] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!rendererRef.current) {
      rendererRef.current = new InkRenderer(ctx, 768, 512);
    }

    return () => {
      rendererRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (isAnimating && currentImagery.length > 0) {
      const displayImagery = selectedImagery ? [selectedImagery] : currentImagery;
      renderer.start(displayImagery, { brushDensity, theme, animSpeed }, currentPoem);
    } else {
      renderer.stop();
      if (currentPoem) {
        const displayImagery = selectedImagery ? [selectedImagery] : currentImagery;
        renderer.render(displayImagery, { brushDensity, theme, animSpeed }, currentPoem);
      }
    }

    return () => {
      renderer.stop();
    };
  }, [isAnimating, currentImagery, currentPoem, brushDensity, theme, animSpeed, selectedImagery]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    if (isPaused) {
      renderer.pause();
    } else {
      renderer.resume();
    }
  }, [isPaused]);

  const handleCanvasClick = useCallback(() => {
    if (!isAnimating) return;
    setIsPaused(!isPaused);
    if (!isPaused) {
      const inspirations: Record<string, string> = {
        '月': '此时月亮已升到中天，银辉洒落山间',
        '山': '群山绵延，墨色由深至浅，远山如黛',
        '水': '流水潺潺，倒映天光云影',
        '花': '花瓣随风飘落，暗香浮动',
        '鸟': '飞鸟掠过天际，留下一道墨痕',
        '舟': '孤舟独泊，水面泛起涟漪',
        '竹': '竹影婆娑，风中摇曳不止',
        '云': '白云悠悠，缠绕于山腰之间',
        '雾': '雾气弥漫，山色若隐若现',
        '雨': '细雨如丝，织就一片朦胧',
        '雪': '飞雪漫天，银装素裹',
        '风': '清风拂过，竹叶沙沙作响',
        '日': '夕阳西沉，余晖染红了天际',
        '星': '繁星点点，映照着寂静的夜',
        '松': '古松苍劲，立于悬崖之上',
        '柳': '垂柳依依，轻拂过水面',
        '桥': '小桥横卧溪上，连接两岸',
        '亭': '孤亭独立，俯瞰烟波浩渺',
        '酒': '浊酒一杯，对影成三人',
        '寺': '古寺钟声，回荡在山谷之间',
      };
      const keyword = currentImagery[0] || '';
      setInspirationText(inspirations[keyword] || '此时此刻，意境正浓');
      setShowInspiration(true);
      setTimeout(() => setShowInspiration(false), 3000);
    } else {
      setShowInspiration(false);
    }
  }, [isAnimating, isPaused, currentImagery, setIsPaused]);

  const handleAddAnnotation = useCallback(() => {
    setShowAnnotationInput(!showAnnotationInput);
  }, [showAnnotationInput]);

  const handleSubmitAnnotation = useCallback(() => {
    if (annotationText.trim()) {
      addAnnotation(annotationText.trim());
      setAnnotationText('');
      setShowAnnotationInput(false);
    }
  }, [annotationText, addAnnotation]);

  const currentAnnotations = annotations.slice(-3);

  return (
    <div style={styles.wrapper}>
      <div style={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={768}
          height={512}
          style={styles.canvas}
          onClick={handleCanvasClick}
        />

        {isPaused && showInspiration && (
          <div style={styles.inspirationBubble}>
            <span style={styles.inspirationIcon}>💡</span>
            {inspirationText}
          </div>
        )}

        {isPaused && (
          <div style={styles.pausedOverlay}>已暂停 · 点击继续</div>
        )}

        {currentAnnotations.map((ann) => (
          <div key={ann.id} style={styles.annotationBubble} title={ann.text}>
            {ann.text.length > 8 ? ann.text.slice(0, 8) + '…' : ann.text}
          </div>
        ))}
      </div>

      <div style={styles.canvasActions}>
        <button style={styles.actionBtn} onClick={handleAddAnnotation}>
          添加注释
        </button>
        {isAnimating && (
          <span style={styles.statusHint}>
            {isPaused ? '⏸ 动画已暂停' : '▶ 动画播放中 · 点击画布暂停'}
          </span>
        )}
      </div>

      {showAnnotationInput && (
        <div style={styles.annotationInputWrap}>
          <input
            style={styles.annotationInput}
            maxLength={100}
            placeholder="添加注释（最多100字）"
            value={annotationText}
            onChange={(e) => setAnnotationText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmitAnnotation();
            }}
          />
          <button style={styles.annSubmitBtn} onClick={handleSubmitAnnotation}>
            ✓
          </button>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  canvasContainer: {
    position: 'relative',
    width: 768,
    height: 512,
    borderRadius: 4,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    cursor: 'pointer',
  },
  canvas: {
    display: 'block',
    width: 768,
    height: 512,
  },
  inspirationBubble: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: '14px 22px',
    fontSize: 15,
    color: '#333',
    fontFamily: '"KaiTi", serif',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    border: '1px solid rgba(0,0,0,0.06)',
    maxWidth: 360,
    textAlign: 'center' as const,
    animation: 'fadeIn 0.3s ease',
    pointerEvents: 'none' as const,
  },
  inspirationIcon: {
    marginRight: 6,
  },
  pausedOverlay: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: 12,
    padding: '4px 14px',
    borderRadius: 20,
    pointerEvents: 'none' as const,
  },
  annotationBubble: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    background: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    border: '1px solid #e0e0e0',
    padding: '4px 8px',
    fontSize: 11,
    color: '#666',
    maxWidth: 100,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    cursor: 'default',
  },
  canvasActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    width: 768,
  },
  actionBtn: {
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: '6px 16px',
    fontSize: 13,
    color: '#555',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  statusHint: {
    fontSize: 12,
    color: '#999',
  },
  annotationInputWrap: {
    display: 'flex',
    gap: 8,
    marginTop: 8,
    width: 600,
  },
  annotationInput: {
    flex: 1,
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 14,
    outline: 'none',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    fontFamily: '"KaiTi", serif',
  },
  annSubmitBtn: {
    width: 40,
    height: 40,
    border: 'none',
    borderRadius: 8,
    background: '#2d6a4f',
    color: '#fff',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default CanvasArea;
