import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import axios from 'axios';

interface Artwork {
  id: string;
  name: string;
  artist: string;
  description: string;
  image: string;
  audioTracks: string[];
  position?: { x: number; y: number; wall: string };
  order?: number;
}

interface ExhibitionProps {
  exhibition: any;
  onUpdate: (exhibition: any) => void;
}

const COLOR_PALETTE = [
  '#000000', '#000033', '#000066', '#000099', '#0000cc', '#0000ff', '#003300', '#003333',
  '#003366', '#003399', '#0033cc', '#0033ff', '#006600', '#006633', '#006666', '#006699',
  '#0066cc', '#0066ff', '#009900', '#009933', '#009966', '#009999', '#0099cc', '#0099ff',
  '#00cc00', '#00cc33', '#00cc66', '#00cc99', '#00cccc', '#00ccff', '#00ff00', '#00ff33',
  '#00ff66', '#00ff99', '#00ffcc', '#00ffff', '#330000', '#330033', '#330066', '#330099',
  '#3300cc', '#3300ff', '#333300', '#333333', '#333366', '#333399', '#3333cc', '#3333ff',
  '#336600', '#336633', '#336666', '#336699', '#3366cc', '#3366ff', '#339900', '#339933',
  '#339966', '#339999', '#3399cc', '#3399ff', '#33cc00', '#33cc33', '#33cc66', '#33cc99',
  '#33cccc', '#33ccff', '#33ff00', '#33ff33', '#33ff66', '#33ff99', '#33ffcc', '#33ffff',
  '#660000', '#660033', '#660066', '#660099', '#6600cc', '#6600ff', '#663300', '#663333',
  '#663366', '#663399', '#6633cc', '#6633ff', '#666600', '#666633', '#666666', '#666699',
  '#6666cc', '#6666ff', '#669900', '#669933', '#669966', '#669999', '#6699cc', '#6699ff',
  '#66cc00', '#66cc33', '#66cc66', '#66cc99', '#66cccc', '#66ccff', '#66ff00', '#66ff33',
  '#66ff66', '#66ff99', '#66ffcc', '#66ffff', '#990000', '#990033', '#990066', '#990099',
  '#9900cc', '#9900ff', '#993300', '#993333', '#993366', '#993399', '#9933cc', '#9933ff',
  '#996600', '#996633', '#996666', '#996699', '#9966cc', '#9966ff', '#999900', '#999933',
  '#999966', '#999999', '#9999cc', '#9999ff', '#99cc00', '#99cc33', '#99cc66', '#99cc99',
  '#99cccc', '#99ccff', '#99ff00', '#99ff33', '#99ff66', '#99ff99', '#99ffcc', '#99ffff',
  '#cc0000', '#cc0033', '#cc0066', '#cc0099', '#cc00cc', '#cc00ff', '#cc3300', '#cc3333',
  '#cc3366', '#cc3399', '#cc33cc', '#cc33ff', '#cc6600', '#cc6633', '#cc6666', '#cc6699',
  '#cc66cc', '#cc66ff', '#cc9900', '#cc9933', '#cc9966', '#cc9999', '#cc99cc', '#cc99ff',
  '#cccc00', '#cccc33', '#cccc66', '#cccc99', '#cccccc', '#ccccff', '#ccff00', '#ccff33',
  '#ccff66', '#ccff99', '#ccffcc', '#ccffff', '#ff0000', '#ff0033', '#ff0066', '#ff0099',
  '#ff00cc', '#ff00ff', '#ff3300', '#ff3333', '#ff3366', '#ff3399', '#ff33cc', '#ff33ff',
  '#ff6600', '#ff6633', '#ff6666', '#ff6699', '#ff66cc', '#ff66ff', '#ff9900', '#ff9933',
  '#ff9966', '#ff9999', '#ff99cc', '#ff99ff', '#ffcc00', '#ffcc33', '#ffcc66', '#ffcc99',
  '#ffcccc', '#ffccff', '#ffff00', '#ffff33', '#ffff66', '#ffff99', '#ffffcc', '#ffffff',
];

const ROOM_WIDTH = 20;
const ROOM_HEIGHT = 15;
const HANG_SPACING = 2;
const PIXELS_PER_METER = 30;

function Exhibition({ exhibition, onUpdate }: ExhibitionProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'artworks' | 'layout'>('settings');
  const [exhibitionName, setExhibitionName] = useState(exhibition?.name || '');
  const [openingDate, setOpeningDate] = useState(exhibition?.openingDate || '');
  const [backgroundColor, setBackgroundColor] = useState(exhibition?.backgroundColor || '#1e293b');
  const [backgroundMode, setBackgroundMode] = useState<'solid' | 'gradient'>(exhibition?.backgroundMode || 'solid');
  const [backgroundGradientEnd, setBackgroundGradientEnd] = useState(exhibition?.backgroundGradientEnd || '#334155');
  const [artworks, setArtworks] = useState<Artwork[]>(exhibition?.artworks || []);
  const [draggedArtwork, setDraggedArtwork] = useState<Artwork | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newArtwork, setNewArtwork] = useState({
    name: '',
    artist: '',
    description: '',
    image: '',
  });
  const [pathOrder, setPathOrder] = useState<string[]>([]);
  const [isEditingPath, setIsEditingPath] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (exhibition) {
      setExhibitionName(exhibition.name);
      setOpeningDate(exhibition.openingDate);
      setBackgroundColor(exhibition.backgroundColor);
      setBackgroundMode(exhibition.backgroundMode);
      setBackgroundGradientEnd(exhibition.backgroundGradientEnd || '#334155');
      setArtworks(exhibition.artworks || []);
    }
  }, [exhibition]);

  useEffect(() => {
    const placed = artworks
      .filter(a => a.position)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    setPathOrder(placed.map(a => a.id));
  }, [artworks]);

  const hangPoints = useMemo(() => {
    const points: { x: number; y: number; wall: string }[] = [];
    
    const numX = Math.floor(ROOM_WIDTH / HANG_SPACING) - 1;
    const numY = Math.floor(ROOM_HEIGHT / HANG_SPACING) - 1;
    
    for (let i = 1; i <= numX; i++) {
      points.push({ x: i * HANG_SPACING, y: 0, wall: 'north' });
      points.push({ x: i * HANG_SPACING, y: ROOM_HEIGHT, wall: 'south' });
    }
    
    for (let i = 1; i <= numY; i++) {
      points.push({ x: 0, y: i * HANG_SPACING, wall: 'west' });
      points.push({ x: ROOM_WIDTH, y: i * HANG_SPACING, wall: 'east' });
    }
    
    return points;
  }, []);

  const handleSaveSettings = async () => {
    try {
      const res = await axios.put(`/api/exhibitions/${exhibition.id}`, {
        name: exhibitionName,
        openingDate,
        backgroundColor,
        backgroundMode,
        backgroundGradientEnd,
      });
      onUpdate(res.data);
      alert('设置保存成功！');
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
    }
  };

  const handleAddArtwork = () => {
    if (!newArtwork.name || !newArtwork.image) {
      alert('请填写作品名称和图片');
      return;
    }
    
    const artwork: Artwork = {
      id: Date.now().toString(),
      ...newArtwork,
      audioTracks: [],
    };
    
    setArtworks([...artworks, artwork]);
    setNewArtwork({ name: '', artist: '', description: '', image: '' });
    setShowAddModal(false);
  };

  const handleDragStart = (artwork: Artwork) => {
    setDraggedArtwork(artwork);
  };

  const handleDrop = (point: { x: number; y: number; wall: string }) => {
    if (!draggedArtwork) return;
    
    const occupied = artworks.some(
      a => a.position?.x === point.x && a.position?.y === point.y
    );
    
    if (occupied) {
      alert('该位置已有作品');
      setDraggedArtwork(null);
      return;
    }
    
    const updated = artworks.map(a => {
      if (a.id === draggedArtwork.id) {
        return { ...a, position: point, order: pathOrder.length };
      }
      return a;
    });
    
    setArtworks(updated);
    setDraggedArtwork(null);
  };

  const handleRemoveFromWall = (artworkId: string) => {
    const updated = artworks.map(a => {
      if (a.id === artworkId) {
        return { ...a, position: undefined, order: undefined };
      }
      return a;
    });
    setArtworks(updated);
  };

  const handleSaveLayout = async () => {
    try {
      const res = await axios.put(`/api/exhibitions/${exhibition.id}/layout`, {
        width: ROOM_WIDTH,
        height: ROOM_HEIGHT,
        artworks,
      });
      onUpdate(res.data);
      alert('布局保存成功！');
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
    }
  };

  const togglePathOrder = (artworkId: string) => {
    if (!isEditingPath) return;
    
    const currentIndex = pathOrder.indexOf(artworkId);
    if (currentIndex === -1) {
      setPathOrder([...pathOrder, artworkId]);
    } else {
      const newOrder = [...pathOrder];
      newOrder.splice(currentIndex, 1);
      setPathOrder(newOrder);
    }
  };

  const movePathItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === pathOrder.length - 1) return;
    
    const newOrder = [...pathOrder];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setPathOrder(newOrder);
    
    const updated = artworks.map(a => {
      const orderIndex = newOrder.indexOf(a.id);
      if (orderIndex !== -1) {
        return { ...a, order: orderIndex };
      }
      return a;
    });
    setArtworks(updated);
  };

  const generateBezierPath = () => {
    const placedArtworks = pathOrder
      .map(id => artworks.find(a => a.id === id))
      .filter(a => a && a.position) as (Artwork & { position: { x: number; y: number } })[];
    
    if (placedArtworks.length < 2) return '';
    
    let path = '';
    const startX = placedArtworks[0].position.x * PIXELS_PER_METER;
    const startY = placedArtworks[0].position.y * PIXELS_PER_METER;
    path += `M ${startX} ${startY}`;
    
    for (let i = 1; i < placedArtworks.length; i++) {
      const prev = placedArtworks[i - 1].position;
      const curr = placedArtworks[i].position;
      
      const cp1x = (prev.x * PIXELS_PER_METER + curr.x * PIXELS_PER_METER) / 2;
      const cp1y = prev.y * PIXELS_PER_METER;
      const cp2x = (prev.x * PIXELS_PER_METER + curr.x * PIXELS_PER_METER) / 2;
      const cp2y = curr.y * PIXELS_PER_METER;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x * PIXELS_PER_METER} ${curr.y * PIXELS_PER_METER}`;
    }
    
    return path;
  };

  const roomWidthPx = ROOM_WIDTH * PIXELS_PER_METER;
  const roomHeightPx = ROOM_HEIGHT * PIXELS_PER_METER;

  const unplacedArtworks = artworks.filter(a => !a.position);
  const placedArtworks = artworks.filter(a => a.position);

  return (
    <div className="exhibition-editor" style={{ height: '100%' }}>
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">策展工作台</div>
        </div>
        
        <div className="tabs" style={{ margin: '12px' }}>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            展览设置
          </button>
          <button 
            className={`tab-btn ${activeTab === 'artworks' ? 'active' : ''}`}
            onClick={() => setActiveTab('artworks')}
          >
            作品管理
          </button>
          <button 
            className={`tab-btn ${activeTab === 'layout' ? 'active' : ''}`}
            onClick={() => setActiveTab('layout')}
          >
            动线编辑
          </button>
        </div>

        {activeTab === 'settings' && (
          <div style={{ padding: '16px' }}>
            <div className="form-group">
              <label className="form-label">展览名称</label>
              <input 
                type="text" 
                className="form-input"
                value={exhibitionName}
                onChange={(e) => setExhibitionName(e.target.value)}
                placeholder="输入展览名称"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">开幕日期</label>
              <input 
                type="date" 
                className="form-input"
                value={openingDate}
                onChange={(e) => setOpeningDate(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">背景模式</label>
              <div className="mode-toggle">
                <button 
                  className={`mode-btn ${backgroundMode === 'solid' ? 'active' : ''}`}
                  onClick={() => setBackgroundMode('solid')}
                >
                  纯色
                </button>
                <button 
                  className={`mode-btn ${backgroundMode === 'gradient' ? 'active' : ''}`}
                  onClick={() => setBackgroundMode('gradient')}
                >
                  渐变
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">背景颜色</label>
              <div className="color-picker-wrapper">
                <div className="color-palette">
                  {COLOR_PALETTE.map((color, i) => (
                    <div
                      key={i}
                      className={`color-swatch ${backgroundColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setBackgroundColor(color)}
                    />
                  ))}
                </div>
                <div 
                  className="color-preview" 
                  style={{ 
                    background: backgroundMode === 'gradient' 
                      ? `linear-gradient(135deg, ${backgroundColor}, ${backgroundGradientEnd})`
                      : backgroundColor 
                  }}
                />
              </div>
            </div>
            
            {backgroundMode === 'gradient' && (
              <div className="form-group">
                <label className="form-label">渐变结束色</label>
                <div className="color-picker-wrapper">
                  <div className="color-palette" style={{ gridTemplateColumns: 'repeat(16, 1fr)' }}>
                    {COLOR_PALETTE.map((color, i) => (
                      <div
                        key={i}
                        className={`color-swatch ${backgroundGradientEnd === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setBackgroundGradientEnd(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={handleSaveSettings}>
              保存设置
            </button>
          </div>
        )}

        {activeTab === 'artworks' && (
          <div style={{ padding: '16px', flex: 1 }}>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginBottom: '16px' }}
              onClick={() => setShowAddModal(true)}
            >
              + 添加作品
            </button>
            
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              待布局作品 ({unplacedArtworks.length})
            </div>
            
            <div className="artwork-list" style={{ padding: 0, flexDirection: 'column' }}>
              {unplacedArtworks.map(artwork => (
                <div
                  key={artwork.id}
                  className="artwork-card"
                  draggable
                  onDragStart={() => handleDragStart(artwork)}
                  style={{ width: '100%', height: 'auto', display: 'flex' }}
                >
                  <img 
                    src={artwork.image} 
                    alt={artwork.name} 
                    className="artwork-thumbnail"
                    style={{ width: '60px', height: '60px' }}
                  />
                  <div className="artwork-info" style={{ flex: 1 }}>
                    <div className="artwork-name">{artwork.name}</div>
                    <div className="artwork-artist">{artwork.artist}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {unplacedArtworks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                暂无待布局作品
              </div>
            )}
          </div>
        )}

        {activeTab === 'layout' && (
          <div style={{ padding: '16px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                动线顺序
              </div>
              <button 
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => setIsEditingPath(!isEditingPath)}
              >
                {isEditingPath ? '完成编辑' : '调整顺序'}
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pathOrder.map((artworkId, index) => {
                const artwork = artworks.find(a => a.id === artworkId);
                if (!artwork) return null;
                return (
                  <div 
                    key={artworkId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--border-radius-sm)',
                      cursor: isEditingPath ? 'pointer' : 'default',
                    }}
                    onClick={() => togglePathOrder(artworkId)}
                  >
                    <span style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      background: 'var(--accent)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}>
                      {index + 1}
                    </span>
                    <img 
                      src={artwork.image} 
                      alt="" 
                      style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{artwork.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{artwork.artist}</div>
                    </div>
                    {isEditingPath && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button 
                          style={{ 
                            padding: '2px 6px', 
                            fontSize: '10px',
                            background: 'var(--bg-secondary)',
                            border: 'none',
                            borderRadius: '3px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                          onClick={(e) => { e.stopPropagation(); movePathItem(index, 'up'); }}
                          disabled={index === 0}
                        >
                          ▲
                        </button>
                        <button 
                          style={{ 
                            padding: '2px 6px', 
                            fontSize: '10px',
                            background: 'var(--bg-secondary)',
                            border: 'none',
                            borderRadius: '3px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                          onClick={(e) => { e.stopPropagation(); movePathItem(index, 'down'); }}
                          disabled={index === pathOrder.length - 1}
                        >
                          ▼
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {pathOrder.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                请先在布局中放置作品
              </div>
            )}
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '16px' }}
              onClick={handleSaveLayout}
            >
              保存布局
            </button>
          </div>
        )}
      </div>

      <div className="layout-canvas" ref={canvasRef}>
        <div 
          className="room-map"
          style={{ 
            width: roomWidthPx, 
            height: roomHeightPx,
            background: backgroundMode === 'gradient' 
              ? `linear-gradient(135deg, ${backgroundColor}, ${backgroundGradientEnd})`
              : backgroundColor,
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <svg 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          >
            <path d={generateBezierPath()} className="path-line" />
          </svg>
          
          {hangPoints.map((point, index) => {
            const artwork = artworks.find(
              a => a.position?.x === point.x && a.position?.y === point.y
            );
            
            return (
              <div
                key={index}
                className={`hang-point ${artwork ? 'occupied' : ''}`}
                style={{
                  left: point.x * PIXELS_PER_METER,
                  top: point.y * PIXELS_PER_METER,
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(point)}
                onClick={() => artwork && handleRemoveFromWall(artwork.id)}
                title={artwork ? '点击移除作品' : '拖放作品到此处'}
              >
                {artwork && (
                  <img 
                    src={artwork.image} 
                    alt={artwork.name}
                    className="hang-point-artwork"
                  />
                )}
              </div>
            );
          })}
          
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'rgba(255,255,255,0.3)',
            fontSize: '14px',
            pointerEvents: 'none',
          }}>
            展厅 {ROOM_WIDTH}m × {ROOM_HEIGHT}m
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">添加作品</div>
            
            <div className="form-group">
              <label className="form-label">作品名称</label>
              <input 
                type="text" 
                className="form-input"
                value={newArtwork.name}
                onChange={(e) => setNewArtwork({ ...newArtwork, name: e.target.value })}
                placeholder="输入作品名称"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">艺术家</label>
              <input 
                type="text" 
                className="form-input"
                value={newArtwork.artist}
                onChange={(e) => setNewArtwork({ ...newArtwork, artist: e.target.value })}
                placeholder="输入艺术家姓名"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">作品描述</label>
              <textarea 
                className="form-input"
                style={{ minHeight: '80px', resize: 'vertical' }}
                value={newArtwork.description}
                onChange={(e) => setNewArtwork({ ...newArtwork, description: e.target.value })}
                placeholder="输入作品描述"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">作品图片</label>
              <input 
                type="text" 
                className="form-input"
                value={newArtwork.image}
                onChange={(e) => setNewArtwork({ ...newArtwork, image: e.target.value })}
                placeholder="输入图片URL (JPG/PNG)"
              />
              {newArtwork.image && (
                <div style={{ marginTop: '10px' }}>
                  <img 
                    src={newArtwork.image} 
                    alt="预览" 
                    style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">音频导览 (最多3段，每段不超过2分钟)</label>
              <div className="audio-track-list">
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  提示：演示版本暂使用模拟音频数据
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleAddArtwork}>
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Exhibition;
