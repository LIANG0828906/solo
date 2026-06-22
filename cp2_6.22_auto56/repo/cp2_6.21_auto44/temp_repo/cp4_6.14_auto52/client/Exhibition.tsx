import { useState, useMemo, useRef, useEffect } from 'react';
import axios from 'axios';
import { Artwork, ExhibitionData } from './App';

interface ExhibitionProps {
  exhibition: ExhibitionData | null;
  onUpdate: (exhibition: ExhibitionData) => void;
}

const COLOR_PALETTE: string[] = [
  '#000000', '#000033', '#000066', '#000099', '#0000cc', '#0000ff',
  '#003300', '#003333', '#003366', '#003399', '#0033cc', '#0033ff',
  '#006600', '#006633', '#006666', '#006699', '#0066cc', '#0066ff',
  '#009900', '#009933', '#009966', '#009999', '#0099cc', '#0099ff',
  '#00cc00', '#00cc33', '#00cc66', '#00cc99', '#00cccc', '#00ccff',
  '#00ff00', '#00ff33', '#00ff66', '#00ff99', '#00ffcc', '#00ffff',
  '#330000', '#330033', '#330066', '#330099', '#3300cc', '#3300ff',
  '#333300', '#333333', '#333366', '#333399', '#3333cc', '#3333ff',
  '#336600', '#336633', '#336666', '#336699', '#3366cc', '#3366ff',
  '#339900', '#339933', '#339966', '#339999', '#3399cc', '#3399ff',
  '#33cc00', '#33cc33', '#33cc66', '#33cc99', '#33cccc', '#33ccff',
  '#33ff00', '#33ff33', '#33ff66', '#33ff99', '#33ffcc', '#33ffff',
  '#660000', '#660033', '#660066', '#660099', '#6600cc', '#6600ff',
  '#663300', '#663333', '#663366', '#663399', '#6633cc', '#6633ff',
  '#666600', '#666633', '#666666', '#666699', '#6666cc', '#6666ff',
  '#669900', '#669933', '#669966', '#669999', '#6699cc', '#6699ff',
  '#66cc00', '#66cc33', '#66cc66', '#66cc99', '#66cccc', '#66ccff',
  '#66ff00', '#66ff33', '#66ff66', '#66ff99', '#66ffcc', '#66ffff',
  '#990000', '#990033', '#990066', '#990099', '#9900cc', '#9900ff',
  '#993300', '#993333', '#993366', '#993399', '#9933cc', '#9933ff',
  '#996600', '#996633', '#996666', '#996699', '#9966cc', '#9966ff',
  '#999900', '#999933', '#999966', '#999999', '#9999cc', '#9999ff',
  '#99cc00', '#99cc33', '#99cc66', '#99cc99', '#99cccc', '#99ccff',
  '#99ff00', '#99ff33', '#99ff66', '#99ff99', '#99ffcc', '#99ffff',
  '#cc0000', '#cc0033', '#cc0066', '#cc0099', '#cc00cc', '#cc00ff',
  '#cc3300', '#cc3333', '#cc3366', '#cc3399', '#cc33cc', '#cc33ff',
  '#cc6600', '#cc6633', '#cc6666', '#cc6699', '#cc66cc', '#cc66ff',
  '#cc9900', '#cc9933', '#cc9966', '#cc9999', '#cc99cc', '#cc99ff',
  '#cccc00', '#cccc33', '#cccc66', '#cccc99', '#cccccc', '#ccccff',
  '#ccff00', '#ccff33', '#ccff66', '#ccff99', '#ccffcc', '#ccffff',
  '#ff0000', '#ff0033', '#ff0066', '#ff0099', '#ff00cc', '#ff00ff',
  '#ff3300', '#ff3333', '#ff3366', '#ff3399', '#ff33cc', '#ff33ff',
  '#ff6600', '#ff6633', '#ff6666', '#ff6699', '#ff66cc', '#ff66ff',
  '#ff9900', '#ff9933', '#ff9966', '#ff9999', '#ff99cc', '#ff99ff',
  '#ffcc00', '#ffcc33', '#ffcc66', '#ffcc99', '#ffcccc', '#ffccff',
  '#ffff00', '#ffff33', '#ffff66', '#ffff99', '#ffffcc', '#ffffff',
  '#111111', '#222222', '#444444', '#555555', '#777777', '#888888',
  '#aaaaaa', '#bbbbbb', '#dddddd', '#eeeeee', '#1a1a1a', '#2a2a2a',
  '#3a3a3a', '#4a4a4a', '#5a5a5a', '#6a6a6a', '#7a7a7a', '#8a8a8a',
  '#9a9a9a', '#aaaaaa', '#bababa', '#cacaca', '#dadada', '#eaeaea',
  '#fafafa', '#f5f5f5', '#f0f0f0', '#ebebeb', '#e5e5e5', '#e0e0e0',
  '#dbdbdb', '#d5d5d5', '#d0d0d0', '#cbcbcb', '#c5c5c5', '#c0c0c0',
  '#bbbbbb', '#b5b5b5', '#b0b0b0', '#ababab', '#a5a5a5', '#a0a0a0',
];

const ROOM_WIDTH = 20;
const ROOM_HEIGHT = 15;
const HANG_SPACING = 2;
const PIXELS_PER_METER = 30;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_AUDIO_COUNT = 3;

function Exhibition({ exhibition, onUpdate }: ExhibitionProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'artworks' | 'layout'>('settings');
  const [exhibitionName, setExhibitionName] = useState(exhibition?.name || '');
  const [openingDate, setOpeningDate] = useState(exhibition?.openingDate || '');
  const [backgroundColor, setBackgroundColor] = useState(exhibition?.backgroundColor || '#1e293b');
  const [backgroundMode, setBackgroundMode] = useState<'solid' | 'gradient'>(exhibition?.backgroundMode || 'solid');
  const [backgroundGradientEnd, setBackgroundGradientEnd] = useState(exhibition?.backgroundGradientEnd || '#334155');
  const [artworks, setArtworks] = useState<Artwork[]>(exhibition?.artworks || []);
  const [draggedArtwork, setDraggedArtwork] = useState<Artwork | null>(null);
  const [dragOverPointIndex, setDragOverPointIndex] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pathOrder, setPathOrder] = useState<string[]>([]);
  const [isEditingPath, setIsEditingPath] = useState(false);

  const [formName, setFormName] = useState('');
  const [formArtist, setFormArtist] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageDragOver, setImageDragOver] = useState(false);
  const [audioDragOver, setAudioDragOver] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
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
    const points: { x: number; y: number; wall: string; offsetX: number; offsetY: number }[] = [];
    const WALL_THICKNESS = 0.2;

    for (let i = 0; i < 10; i++) {
      const x = 1 + i * HANG_SPACING;
      points.push({ x, y: 0, wall: 'north', offsetX: 0, offsetY: WALL_THICKNESS });
      points.push({ x, y: ROOM_HEIGHT, wall: 'south', offsetX: 0, offsetY: -WALL_THICKNESS });
    }

    for (let i = 0; i < 7; i++) {
      const y = 1 + i * HANG_SPACING;
      points.push({ x: 0, y, wall: 'west', offsetX: WALL_THICKNESS, offsetY: 0 });
      points.push({ x: ROOM_WIDTH, y, wall: 'east', offsetX: -WALL_THICKNESS, offsetY: 0 });
    }

    return points;
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormArtist('');
    setFormDescription('');
    setImageFile(null);
    setImagePreview('');
    setAudioFiles([]);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleImageSelect = (file: File) => {
    if (!file.type.match(/image\/(jpeg|jpg|png)/i)) {
      alert('只支持 JPG/PNG 格式的图片');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      alert('图片大小不能超过 5MB');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setImageDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  };

  const handleAudioSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(f => {
      if (!f.type.match(/audio\/(mpeg|mp3)/i) && !f.name.toLowerCase().endsWith('.mp3')) {
        alert(`文件 ${f.name} 不是 MP3 格式`);
        return false;
      }
      return true;
    });
    const totalCount = audioFiles.length + newFiles.length;
    if (totalCount > MAX_AUDIO_COUNT) {
      alert(`最多只能上传 ${MAX_AUDIO_COUNT} 段音频`);
      const allowed = MAX_AUDIO_COUNT - audioFiles.length;
      if (allowed > 0) {
        setAudioFiles([...audioFiles, ...newFiles.slice(0, allowed)]);
      }
    } else {
      setAudioFiles([...audioFiles, ...newFiles]);
    }
  };

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setAudioDragOver(false);
    handleAudioSelect(e.dataTransfer.files);
  };

  const removeAudio = (index: number) => {
    setAudioFiles(audioFiles.filter((_, i) => i !== index));
  };

  const handleAddArtwork = async () => {
    if (!formName.trim()) {
      alert('请填写作品名称');
      return;
    }
    if (!imageFile && !imagePreview) {
      alert('请上传作品图片');
      return;
    }
    if (!exhibition) {
      alert('展览数据未加载');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append('image', imageFile);
      }
      audioFiles.forEach((file, i) => {
        formData.append(`audio${i + 1}`, file);
      });

      const uploadRes = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      if (!uploadRes.data.success) {
        throw new Error(uploadRes.data.error || '上传失败');
      }

      const artworkData = {
        name: formName,
        artist: formArtist,
        description: formDescription,
        image: uploadRes.data.data.image || imagePreview,
        audioTracks: uploadRes.data.data.audioTracks || [],
      };

      const artworkRes = await axios.post(`/api/exhibitions/${exhibition.id}/artworks`, artworkData);
      const newArtwork = artworkRes.data as Artwork;

      const updatedExhibitionRes = await axios.get(`/api/exhibitions/${exhibition.id}`);
      onUpdate(updatedExhibitionRes.data);
      setArtworks(updatedExhibitionRes.data.artworks || []);

      setShowAddModal(false);
      resetForm();
      alert('作品添加成功！');
    } catch (err: any) {
      console.error('添加作品失败:', err);
      alert(err.response?.data?.error || '添加失败，请重试');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragStart = (e: React.DragEvent, artwork: Artwork) => {
    setDraggedArtwork(artwork);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', artwork.id);
  };

  const handleDragEnd = () => {
    setDraggedArtwork(null);
    setDragOverPointIndex(null);
  };

  const handleDragOverPoint = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverPointIndex !== index) {
      setDragOverPointIndex(index);
    }
  };

  const handleDragLeavePoint = () => {
    setDragOverPointIndex(null);
  };

  const handleDrop = (point: { x: number; y: number; wall: string }) => {
    setDragOverPointIndex(null);
    if (!draggedArtwork) return;

    const occupied = artworks.some(
      a => a.position?.x === point.x && a.position?.y === point.y && a.id !== draggedArtwork.id
    );

    if (occupied) {
      alert('该位置已有作品');
      setDraggedArtwork(null);
      return;
    }

    const currentPlacedCount = artworks.filter(a => a.position).length;

    const updated = artworks.map(a => {
      if (a.id === draggedArtwork.id) {
        return { ...a, position: point, order: a.order !== undefined ? a.order : currentPlacedCount };
      }
      return a;
    });

    setArtworks(updated);
    setDraggedArtwork(null);
  };

  const handleRemoveFromWall = (artworkId: string) => {
    if (!confirm('确定要从墙上移除此作品吗？')) return;
    const updated = artworks.map(a => {
      if (a.id === artworkId) {
        return { ...a, position: undefined, order: undefined };
      }
      return a;
    });
    const reOrdered = updated
      .filter(a => a.position)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((a, idx) => ({ ...a, order: idx }));

    const finalArtworks = updated.map(a => {
      const found = reOrdered.find(r => r.id === a.id);
      return found || a;
    });

    setArtworks(finalArtworks);
  };

  const handleSaveSettings = async () => {
    if (!exhibition) return;
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

  const handleSaveLayout = async () => {
    if (!exhibition) return;
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
    const getOffsetForWall = (wall: string) => {
      const WALL_THICKNESS = 0.2;
      switch (wall) {
        case 'north': return { ox: 0, oy: WALL_THICKNESS };
        case 'south': return { ox: 0, oy: -WALL_THICKNESS };
        case 'west': return { ox: WALL_THICKNESS, oy: 0 };
        case 'east': return { ox: -WALL_THICKNESS, oy: 0 };
        default: return { ox: 0, oy: 0 };
      }
    };

    const placedArtworks = pathOrder
      .map(id => artworks.find(a => a.id === id))
      .filter(a => a && a.position) as (Artwork & { position: { x: number; y: number; wall: string } })[];

    if (placedArtworks.length < 2) return '';

    const getPx = (p: { x: number; y: number; wall: string }) => {
      const off = getOffsetForWall(p.wall);
      return {
        px: (p.x + off.ox) * PIXELS_PER_METER,
        py: (p.y + off.oy) * PIXELS_PER_METER,
      };
    };

    let path = '';
    const start = getPx(placedArtworks[0].position);
    path += `M ${start.px} ${start.py}`;

    for (let i = 1; i < placedArtworks.length; i++) {
      const prevPos = placedArtworks[i - 1].position;
      const currPos = placedArtworks[i].position;
      const prev = getPx(prevPos);
      const curr = getPx(currPos);

      const dx = curr.px - prev.px;
      const dy = curr.py - prev.py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const offset = Math.min(dist * 0.3, 80);

      const cp1x = prev.px + (dx === 0 ? offset : dx * 0.5);
      const cp1y = prev.py + (dy === 0 ? 0 : dy * 0.2);
      const cp2x = curr.px - (dx === 0 ? offset : dx * 0.5);
      const cp2y = curr.py - (dy === 0 ? 0 : dy * 0.2);

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.px} ${curr.py}`;
    }

    return path;
  };

  const roomWidthPx = ROOM_WIDTH * PIXELS_PER_METER;
  const roomHeightPx = ROOM_HEIGHT * PIXELS_PER_METER;

  const unplacedArtworks = artworks.filter(a => !a.position);

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
                  {COLOR_PALETTE.slice(0, 256).map((color, i) => (
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
                  <div className="color-palette">
                    {COLOR_PALETTE.slice(0, 256).map((color, i) => (
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

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={handleSaveSettings}
            >
              保存设置
            </button>
          </div>
        )}

        {activeTab === 'artworks' && (
          <div style={{ padding: '16px', flex: 1 }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '16px' }}
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
            >
              + 添加作品
            </button>

            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              待布局作品 ({unplacedArtworks.length})
            </div>

            <div className="artwork-list" style={{ padding: 0, flexDirection: 'column', gap: '12px' }}>
              {unplacedArtworks.map(artwork => (
                <div
                  key={artwork.id}
                  className="artwork-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, artwork)}
                  onDragEnd={handleDragEnd}
                  style={{ width: '100%', height: 'auto', display: 'flex' }}
                >
                  <img
                    src={artwork.image}
                    alt={artwork.name}
                    className="artwork-thumbnail"
                    style={{ width: '60px', height: '60px', flexShrink: 0 }}
                  />
                  <div className="artwork-info" style={{ flex: 1, minWidth: 0 }}>
                    <div className="artwork-name" title={artwork.name}>{artwork.name}</div>
                    <div className="artwork-artist">{artwork.artist || '未知艺术家'}</div>
                    {artwork.audioTracks.length > 0 && (
                      <div style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '2px' }}>
                        🎵 {artwork.audioTracks.length} 段导览
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {unplacedArtworks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                暂无待布局作品，点击上方按钮添加
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
                      transition: 'all 0.2s ease',
                    }}
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
                      flexShrink: 0,
                    }}>
                      {index + 1}
                    </span>
                    <img
                      src={artwork.image}
                      alt=""
                      style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artwork.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{artwork.artist || '未知'}</div>
                    </div>
                    {isEditingPath && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button
                          style={{
                            padding: '2px 8px',
                            fontSize: '10px',
                            background: index === 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                            border: 'none',
                            borderRadius: '4px',
                            color: index === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onClick={() => movePathItem(index, 'up')}
                          disabled={index === 0}
                        >
                          ▲
                        </button>
                        <button
                          style={{
                            padding: '2px 8px',
                            fontSize: '10px',
                            background: index === pathOrder.length - 1 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                            border: 'none',
                            borderRadius: '4px',
                            color: index === pathOrder.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                            cursor: index === pathOrder.length - 1 ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onClick={() => movePathItem(index, 'down')}
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
                请先在"作品管理"中拖拽作品到展厅布局
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
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
          >
            <path d={generateBezierPath()} className="path-line" />
          </svg>

          {hangPoints.map((point, index) => {
            const artwork = artworks.find(
              a => a.position?.x === point.x && a.position?.y === point.y && a.position?.wall === point.wall
            );
            const isDragOver = dragOverPointIndex === index;
            const left = (point.x + point.offsetX) * PIXELS_PER_METER;
            const top = (point.y + point.offsetY) * PIXELS_PER_METER;

            return (
              <div
                key={index}
                className={`hang-point ${artwork ? 'occupied' : ''} ${isDragOver ? 'drag-over' : ''}`}
                style={{
                  left,
                  top,
                }}
                onDragOver={(e) => handleDragOverPoint(e, index)}
                onDragLeave={handleDragLeavePoint}
                onDrop={() => handleDrop(point)}
                onClick={() => artwork && handleRemoveFromWall(artwork.id)}
                title={artwork ? `《${artwork.name}》- 点击移除` : '拖放作品到此处'}
              >
                {artwork && (
                  <>
                    <img
                      src={artwork.image}
                      alt={artwork.name}
                      className="hang-point-artwork"
                    />
                    {artwork.order !== undefined && (
                      <span style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-sm)',
                        zIndex: 2,
                      }}>
                        {artwork.order + 1}
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })}

          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'rgba(255,255,255,0.25)',
            fontSize: '16px',
            fontWeight: '600',
            pointerEvents: 'none',
            letterSpacing: '2px',
          }}>
            展厅 {ROOM_WIDTH}m × {ROOM_HEIGHT}m
          </div>

          <div style={{
            position: 'absolute',
            top: '-28px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'var(--text-muted)',
            fontSize: '11px',
          }}>
            北墙 N
          </div>
          <div style={{
            position: 'absolute',
            bottom: '-28px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'var(--text-muted)',
            fontSize: '11px',
          }}>
            南墙 S
          </div>
          <div style={{
            position: 'absolute',
            left: '-28px',
            top: '50%',
            transform: 'translateY(-50%) rotate(-90deg)',
            color: 'var(--text-muted)',
            fontSize: '11px',
          }}>
            西墙 W
          </div>
          <div style={{
            position: 'absolute',
            right: '-28px',
            top: '50%',
            transform: 'translateY(-50%) rotate(90deg)',
            color: 'var(--text-muted)',
            fontSize: '11px',
          }}>
            东墙 E
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => !isUploading && setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">添加作品</div>

            <div className="form-group">
              <label className="form-label">作品名称 *</label>
              <input
                type="text"
                className="form-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="输入作品名称"
                disabled={isUploading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">艺术家</label>
              <input
                type="text"
                className="form-input"
                value={formArtist}
                onChange={(e) => setFormArtist(e.target.value)}
                placeholder="输入艺术家姓名"
                disabled={isUploading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">作品描述</label>
              <textarea
                className="form-input"
                style={{ minHeight: '80px', resize: 'vertical' }}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="输入作品描述"
                disabled={isUploading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">作品图片 (JPG/PNG, ≤5MB) *</label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
                disabled={isUploading}
              />
              {!imagePreview ? (
                <div
                  className={`upload-area ${imageDragOver ? 'dragover' : ''}`}
                  onClick={() => !isUploading && imageInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setImageDragOver(true); }}
                  onDragLeave={() => setImageDragOver(false)}
                  onDrop={handleImageDrop}
                >
                  <div className="upload-icon">🖼️</div>
                  <div className="upload-text">点击或拖拽图片到此处上传</div>
                  <div className="upload-hint">支持 JPG、PNG 格式，最大 5MB</div>
                </div>
              ) : (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={imagePreview}
                    alt="预览"
                    className="preview-image"
                    style={{ maxHeight: '180px', width: 'auto' }}
                  />
                  {!isUploading && (
                    <button
                      onClick={() => { setImageFile(null); setImagePreview(''); }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(239,68,68,0.9)',
                        border: 'none',
                        color: 'white',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      ×
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">音频导览 (MP3, 最多{MAX_AUDIO_COUNT}段)</label>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/mpeg,audio/mp3,.mp3"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleAudioSelect(e.target.files)}
                disabled={isUploading || audioFiles.length >= MAX_AUDIO_COUNT}
              />
              {audioFiles.length < MAX_AUDIO_COUNT && (
                <div
                  className={`upload-area ${audioDragOver ? 'dragover' : ''}`}
                  style={{ padding: '24px 16px' }}
                  onClick={() => !isUploading && audioFiles.length < MAX_AUDIO_COUNT && audioInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setAudioDragOver(true); }}
                  onDragLeave={() => setAudioDragOver(false)}
                  onDrop={handleAudioDrop}
                >
                  <div className="upload-icon" style={{ fontSize: '28px' }}>🎵</div>
                  <div className="upload-text">点击或拖拽 MP3 文件到此处</div>
                  <div className="upload-hint">
                    已上传 {audioFiles.length}/{MAX_AUDIO_COUNT} 段
                  </div>
                </div>
              )}

              {audioFiles.length > 0 && (
                <div className="audio-track-list">
                  {audioFiles.map((file, i) => (
                    <div key={i} className="audio-track-item">
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        minWidth: 0,
                        flex: 1,
                      }}>
                        <span style={{
                          width: '20px', height: '20px',
                          borderRadius: '4px',
                          background: 'var(--accent)',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {i + 1}
                        </span>
                        <span style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }} title={file.name}>
                          {file.name}
                        </span>
                        <span style={{
                          color: 'var(--text-muted)',
                          fontSize: '11px',
                          flexShrink: 0,
                        }}>
                          {(file.size / 1024 / 1024).toFixed(1)}MB
                        </span>
                      </span>
                      {!isUploading && (
                        <button
                          className="track-delete-btn"
                          onClick={() => removeAudio(i)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isUploading && uploadProgress > 0 && (
              <div className="upload-progress">
                <div
                  className="upload-progress-bar"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
                disabled={isUploading}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddArtwork}
                disabled={isUploading}
              >
                {isUploading ? `上传中 ${uploadProgress}%` : '添加作品'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Exhibition;
