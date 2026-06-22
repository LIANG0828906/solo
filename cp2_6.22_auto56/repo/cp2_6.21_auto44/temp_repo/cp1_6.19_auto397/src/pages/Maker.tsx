import React, { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useGalleryStore, type Meme } from '../store/galleryStore';
import { faceComponents, type CanvasComponent, type CanvasText } from '../utils/componentRenderer';
import ComponentPanel from '../components/ComponentPanel';
import AdjustPanel from '../components/AdjustPanel';
import MemeCanvas from '../components/Canvas';
import PublishModal from '../components/PublishModal';
import './Maker.css';

const generateId = () => Math.random().toString(36).substr(2, 9);

const Maker: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [textMode, setTextMode] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const canvasComponents = useGalleryStore((s) => s.canvasComponents);
  const canvasText = useGalleryStore((s) => s.canvasText);
  const selectedComponentId = useGalleryStore((s) => s.selectedComponentId);
  const addCanvasComponent = useGalleryStore((s) => s.addCanvasComponent);
  const updateCanvasComponent = useGalleryStore((s) => s.updateCanvasComponent);
  const removeCanvasComponent = useGalleryStore((s) => s.removeCanvasComponent);
  const setCanvasText = useGalleryStore((s) => s.setCanvasText);
  const updateCanvasText = useGalleryStore((s) => s.updateCanvasText);
  const setSelectedComponentId = useGalleryStore((s) => s.setSelectedComponentId);
  const clearCanvas = useGalleryStore((s) => s.clearCanvas);
  const addMeme = useGalleryStore((s) => s.addMeme);
  const showToast = useGalleryStore((s) => s.showToast);

  const selectedComponent = canvasComponents.find((c) => c.id === selectedComponentId) || null;

  const handleSelectComponent = useCallback(
    (type: string, componentId: string, baseColor: string) => {
      const newComponent: CanvasComponent = {
        id: generateId(),
        type,
        componentId,
        x: 250,
        y: 200,
        scale: 1,
        rotation: 0,
        color: baseColor,
        zIndex: canvasComponents.length + 1
      };
      addCanvasComponent(newComponent);
      setTextMode(false);
    },
    [canvasComponents.length, addCanvasComponent]
  );

  const handleMoveComponent = useCallback(
    (id: string, x: number, y: number) => {
      updateCanvasComponent(id, { x, y });
    },
    [updateCanvasComponent]
  );

  const handleMoveText = useCallback(
    (x: number, y: number) => {
      updateCanvasText({ x, y });
    },
    [updateCanvasText]
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const content = e.target.value.slice(0, 15);
    if (!canvasText) {
      setCanvasText({
        id: 'text',
        content,
        x: 250,
        y: 360,
        fontSize: 24,
        color: '#333333',
        fontFamily: 'inherit'
      });
    } else {
      updateCanvasText({ content });
    }
    setTextMode(true);
    setSelectedComponentId(null);
  };

  const handleCanvasClick = () => {
    setSelectedComponentId(null);
    setTextMode(false);
  };

  const handleSelectText = () => {
    setTextMode(true);
    setSelectedComponentId(null);
  };

  const captureCanvas = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!canvasRef.current) {
        resolve(null);
        return;
      }

      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="500" height="400" viewBox="0 0 500 400">
          <defs>
            <radialGradient id="faceBg" cx="50%" cy="50%">
              <stop offset="0%" style="stop-color:#FFE4E1"/>
              <stop offset="100%" style="stop-color:#FFC0CB"/>
            </radialGradient>
          </defs>
          <ellipse cx="250" cy="200" rx="175" ry="120" fill="url(#faceBg)" opacity="0.7"/>
          ${canvasComponents
            .map((c) => {
              const def = faceComponents.find((f) => f.id === c.componentId);
              return `<g transform="translate(${c.x}, ${c.y}) scale(${c.scale}) rotate(${c.rotation}) translate(-50, -50)" style="color:${c.color}"><svg width="100" height="100" viewBox="0 0 100 100">${def?.svgContent || ''}</svg></g>`;
            })
            .join('')}
          ${canvasText && canvasText.content
            ? `<text x="${canvasText.x}" y="${canvasText.y}" fill="${canvasText.color}" font-size="${canvasText.fontSize}" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${canvasText.content}</text>`
            : ''}
        </svg>
      `;

      const img = new Image();
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              resolve(blob);
            },
            'image/jpeg',
            0.85
          );
        } else {
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    });
  };

  const handlePublish = async (tags: string[], description: string) => {
    try {
      const formData = new FormData();
      formData.append('tags', JSON.stringify(tags));
      formData.append('description', description);
      formData.append('author', '匿名创作者');
      formData.append('components', JSON.stringify(canvasComponents));
      formData.append('text', canvasText ? JSON.stringify(canvasText) : '');

      const blob = await captureCanvas();
      if (blob) {
        formData.append('image', blob, 'meme.jpg');
      }

      const res = await axios.post('/api/gallery', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newMeme: Meme = res.data;
      if (!newMeme.imageUrl) {
        const placeholderColors = ['#FF80AB', '#64B5F6', '#81C784', '#FFB74D'];
        const colorIdx = Math.floor(Math.random() * placeholderColors.length);
        newMeme.imageUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280"><rect width="280" height="280" fill="${placeholderColors[colorIdx]}" opacity="0.3"/><circle cx="140" cy="140" r="80" fill="${placeholderColors[colorIdx]}" opacity="0.5"/><text x="140" y="155" font-size="50" text-anchor="middle">😊</text></svg>`
        )}`;
      }

      addMeme(newMeme);
      setPublishOpen(false);
      clearCanvas();
      showToast('发布成功！');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      console.error('Publish failed:', err);
      showToast('发布失败，请重试', 'error');
    }
  };

  return (
    <div className="maker-page">
      <div className="maker-header">
        <button className="maker-back ripple-btn" onClick={() => navigate('/')}>
          ← 返回画廊
        </button>
        <h2 className="maker-title">🎨 表情包制作室</h2>
        <div className="maker-actions">
          <button
            className="maker-clear ripple-btn"
            onClick={clearCanvas}
          >
            🧹 清空
          </button>
          <button
            className="maker-publish ripple-btn"
            onClick={() => setPublishOpen(true)}
          >
            🚀 发布
          </button>
        </div>
      </div>

      <div className="maker-content">
        <ComponentPanel onSelectComponent={handleSelectComponent} />

        <div className="maker-center">
          <MemeCanvas
            canvasRef={canvasRef}
            components={canvasComponents}
            text={canvasText}
            selectedComponentId={selectedComponentId}
            textMode={textMode}
            onSelectComponent={setSelectedComponentId}
            onSelectText={handleSelectText}
            onMoveComponent={handleMoveComponent}
            onMoveText={handleMoveText}
            onCanvasClick={handleCanvasClick}
          />

          <div className="maker-text-tool">
            <input
              type="text"
              className="maker-text-input"
              placeholder="✍️ 添加文字（最多15字）"
              value={canvasText?.content || ''}
              onChange={handleTextChange}
              maxLength={15}
              onClick={(e) => {
                e.stopPropagation();
                setTextMode(true);
                setSelectedComponentId(null);
              }}
            />
            {canvasText?.content && (
              <span className="maker-text-count">
                {canvasText.content.length}/15
              </span>
            )}
          </div>
        </div>

        <AdjustPanel
          selectedComponent={selectedComponent}
          canvasText={canvasText}
          textMode={textMode}
          onUpdateComponent={updateCanvasComponent}
          onUpdateText={updateCanvasText}
          onDeleteComponent={removeCanvasComponent}
        />
      </div>

      <PublishModal
        isOpen={publishOpen}
        onClose={() => setPublishOpen(false)}
        onPublish={handlePublish}
      />
    </div>
  );
};

export default Maker;
