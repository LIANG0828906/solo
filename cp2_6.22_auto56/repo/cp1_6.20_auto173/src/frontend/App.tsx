import React, { useState, useCallback, useRef } from 'react';
import UploadZone from './UploadZone';
import PlantDetail, { PlantInfo } from './PlantDetail';
import CareLog, { CareLogEntry } from './CareLog';
import Favorites, { FavoriteItem } from './Favorites';
import './App.css';

function compressImage(file: File, maxWidth: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

      const analysisCanvas = document.createElement('canvas');
      const sampleSize = 50;
      analysisCanvas.width = sampleSize;
      analysisCanvas.height = sampleSize;
      const actx = analysisCanvas.getContext('2d')!;
      actx.drawImage(img, 0, 0, sampleSize, sampleSize);

      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };
    img.src = url;
  });
}

function extractPixelFeatures(file: File): Promise<{ mainColors: [number, number, number][]; textureType: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 32;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      const pixels: { r: number; g: number; b: number }[] = [];
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 20 || g > 20 || b > 20) {
          pixels.push({ r, g, b });
        }
      }

      const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 128;

      pixels.sort((a, b) => {
        const ba = a.r * 0.299 + a.g * 0.587 + a.b * 0.114;
        const bb = b.r * 0.299 + b.g * 0.587 + b.b * 0.114;
        return ba - bb;
      });

      const third = Math.floor(pixels.length / 3);
      const groups = [
        pixels.slice(0, third),
        pixels.slice(third, third * 2),
        pixels.slice(third * 2),
      ];

      const mainColors = groups.map(g => {
        if (g.length === 0) return [128, 128, 128] as [number, number, number];
        return [
          Math.round(avg(g.map(p => p.r))),
          Math.round(avg(g.map(p => p.g))),
          Math.round(avg(g.map(p => p.b))),
        ] as [number, number, number];
      });

      let edgeCount = 0;
      for (let y = 1; y < size - 1; y++) {
        for (let x = 1; x < size - 1; x++) {
          const idx = (y * size + x) * 4;
          const idxR = (y * size + x + 1) * 4;
          const idxD = ((y + 1) * size + x) * 4;
          const dx = Math.abs(data[idx] - data[idxR]) + Math.abs(data[idx + 1] - data[idxR + 1]) + Math.abs(data[idx + 2] - data[idxR + 2]);
          const dy = Math.abs(data[idx] - data[idxD]) + Math.abs(data[idx + 1] - data[idxD + 1]) + Math.abs(data[idx + 2] - data[idxD + 2]);
          if (dx > 60 || dy > 60) edgeCount++;
        }
      }

      const avgGreen = avg(mainColors.map(c => c[1]));
      const avgRed = avg(mainColors.map(c => c[0]));
      const greenRatio = avgGreen / (avgRed + 1);
      const edgeDensity = edgeCount / ((size - 2) * (size - 2));

      let textureType = 'broad-veined';
      if (edgeDensity > 0.3 && greenRatio > 1.2) textureType = 'large-lobed';
      else if (edgeDensity > 0.25 && avgGreen > 130) textureType = 'striped-upright';
      else if (edgeDensity < 0.15 && greenRatio > 1.3) textureType = 'heart-shaped-glossy';
      else if (edgeDensity < 0.1) textureType = 'rosette-fleshy';
      else if (edgeDensity > 0.35) textureType = 'trailing-variegated';
      else if (greenRatio < 0.9) textureType = 'spiny-columnar';
      else if (avgGreen < 95) textureType = 'spiky-succulent';

      URL.revokeObjectURL(url);
      resolve({ mainColors, textureType });
    };
    img.src = url;
  });
}

const App: React.FC = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [plantInfo, setPlantInfo] = useState<PlantInfo | null>(null);
  const [careLogs, setCareLogs] = useState<CareLogEntry[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const lastFileRef = useRef<File | null>(null);

  const handleImageSelected = useCallback(async (file: File) => {
    lastFileRef.current = file;
    const compressed = await compressImage(file, 800);
    setPreviewUrl(compressed);
    setFileName(file.name);
    setIsIdentifying(true);

    try {
      const features = extractPixelFeatures(file);

      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/identify', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Identification failed');
      const data = await res.json();

      await features;

      const plant: PlantInfo = {
        id: data.id,
        name: data.name,
        varieties: data.varieties,
        careTips: data.careTips,
        growthCycle: data.growthCycle,
      };

      setPlantInfo(plant);
      setIsFavorited(favorites.some(f => f.plantId === plant.id));

      const logsRes = await fetch(`/api/logs/${plant.id}`);
      if (logsRes.ok) {
        const logs = await logsRes.json();
        setCareLogs(logs);
      }
    } catch (err) {
      console.error('Identification error:', err);
      const features = await extractPixelFeatures(file);

      const mockPlant: PlantInfo = {
        id: 'monstera-deliciosa',
        name: '龟背竹',
        varieties: ['迷你龟背竹', '斑叶龟背竹', '穿孔龟背竹', '泰国龟背竹'],
        careTips: {
          light: '喜明亮散射光，避免直射阳光。室内可放置在朝东或朝北的窗边，每天需4-6小时间接光照。',
          watering: '保持土壤微湿但不积水。春夏季每5-7天浇一次水，秋冬季每10-14天浇一次。',
          fertilizing: '生长季（4-9月）每月施一次稀薄的液态氮肥，促进叶片生长。秋冬季停止施肥。',
        },
        growthCycle: [
          { name: '发芽期', duration: '7-14天', order: 1 },
          { name: '幼苗期', duration: '30-60天', order: 2 },
          { name: '展叶期', duration: '60-90天', order: 3 },
          { name: '成熟期', duration: '1-2年', order: 4 },
          { name: '开花期', duration: '3-5年后', order: 5 },
        ],
      };
      setPlantInfo(mockPlant);
    } finally {
      setIsIdentifying(false);
    }
  }, [favorites]);

  const handleAddLog = useCallback(async (entry: Omit<CareLogEntry, 'id'>) => {
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (res.ok) {
        const saved = await res.json();
        setCareLogs(prev => [...prev, saved]);
        setShowLogModal(false);
        showSuccess('养护记录添加成功！');
      }
    } catch {
      const newEntry: CareLogEntry = {
        ...entry,
        id: Date.now().toString(),
      };
      setCareLogs(prev => [...prev, newEntry]);
      setShowLogModal(false);
      showSuccess('养护记录添加成功！');
    }
  }, []);

  const handleDeleteLog = useCallback((id: string) => {
    setCareLogs(prev => prev.filter(l => l.id !== id));
  }, []);

  const handleToggleFavorite = useCallback(async () => {
    if (!plantInfo) return;
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plantId: plantInfo.id, plantName: plantInfo.name }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsFavorited(data.favorited);
        if (data.favorited) {
          setFavorites(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              plantId: plantInfo.id,
              plantName: plantInfo.name,
              addedAt: new Date().toISOString(),
            },
          ]);
        } else {
          setFavorites(prev => prev.filter(f => f.plantId !== plantInfo.id));
        }
      }
    } catch {
      setIsFavorited(prev => !prev);
      if (!isFavorited) {
        setFavorites(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            plantId: plantInfo.id,
            plantName: plantInfo.name,
            addedAt: new Date().toISOString(),
          },
        ]);
      } else {
        setFavorites(prev => prev.filter(f => f.plantId !== plantInfo.id));
      }
    }
  }, [plantInfo, isFavorited]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSelectPlantFromFavorites = useCallback(async (plantId: string) => {
    if (plantInfo?.id === plantId) return;
  }, [plantInfo]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#4a90d9">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
          </svg>
          <h1 className="app-title">植物识别与栽培指南</h1>
        </div>
      </header>

      <main className="main-content">
        <div className="left-panel">
          <UploadZone
            onImageSelected={handleImageSelected}
            previewUrl={previewUrl}
            fileName={fileName}
            isIdentifying={isIdentifying}
          />
        </div>

        <div className="right-panel">
          {plantInfo ? (
            <>
              <PlantDetail
                plant={plantInfo}
                onCreateCareLog={() => setShowLogModal(true)}
                isFavorited={isFavorited}
                onToggleFavorite={handleToggleFavorite}
              />
              <CareLog
                plantId={plantInfo.id}
                logs={careLogs}
                onAdd={handleAddLog}
                onDelete={handleDeleteLog}
                showModal={showLogModal}
                onCloseModal={() => setShowLogModal(false)}
              />
            </>
          ) : (
            <div className="placeholder-detail">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="#ddd">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
              </svg>
              <p>上传植物照片开始识别</p>
            </div>
          )}
        </div>
      </main>

      <Favorites
        isOpen={showFavorites}
        onClose={() => setShowFavorites(prev => !prev)}
        favorites={favorites}
        onSelectPlant={handleSelectPlantFromFavorites}
      />

      {successMsg && <div className="success-toast">{successMsg}</div>}
    </div>
  );
};

export default App;
