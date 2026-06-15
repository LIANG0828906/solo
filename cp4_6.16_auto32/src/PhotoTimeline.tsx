import { useState, useCallback, useMemo, useRef } from 'react';
import exifr from 'exifr';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useTravelStore } from './store';
import type { Photo, DayGroup, Weather } from './types';

interface PendingPhoto {
  file: File;
  dataUrl: string;
  captureTime: string | null;
  latitude: number | null;
  longitude: number | null;
  needsManualInput: boolean;
  cityName?: string;
  weather?: Weather;
}

const weatherIcons: Record<Weather, { icon: string; label: string }> = {
  sunny: { icon: '☀️', label: '晴天' },
  cloudy: { icon: '☁️', label: '阴天' },
  rainy: { icon: '🌧️', label: '雨天' }
};

const weatherOptions: Weather[] = ['sunny', 'cloudy', 'rainy'];

function groupByDate(photos: Photo[]): DayGroup[] {
  const groups = new Map<string, Photo[]>();
  photos.forEach((photo) => {
    const dateKey = format(new Date(photo.captureTime), 'yyyy-MM-dd');
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(photo);
  });
  return Array.from(groups.entries())
    .map(([date, photos]) => ({ date, photos }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function randomWeather(): Weather {
  return weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  backgroundColor: '#1e1e2e',
  border: '1px solid #3d3d5c',
  borderRadius: '8px',
  color: '#e0e0ff',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box'
};

const buttonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
  color: 'white',
  border: 'none',
  padding: '12px 24px',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'filter 0.2s ease',
  fontSize: '14px'
};

const buttonHover: React.CSSProperties = {
  ...buttonStyle,
  filter: 'brightness(1.15)'
};

function MissingDataModal({
  pendingPhotos,
  onComplete,
  onCancel
}: {
  pendingPhotos: PendingPhoto[];
  onComplete: (photos: PendingPhoto[]) => void;
  onCancel: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cityName, setCityName] = useState('');
  const [captureTime, setCaptureTime] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [btnHover, setBtnHover] = useState(false);
  const [weather, setWeather] = useState<Weather>('sunny');

  const current = pendingPhotos[currentIndex];
  const needsInput = pendingPhotos.filter((p) => p.needsManualInput);
  const currentNeedInput = needsInput[currentIndex];

  if (!currentNeedInput) {
    onComplete(pendingPhotos);
    return null;
  }

  const handleNext = () => {
    if (!cityName || !captureTime) {
      alert('请填写城市和拍摄时间');
      return;
    }
    currentNeedInput.cityName = cityName;
    currentNeedInput.captureTime = new Date(captureTime).toISOString();
    currentNeedInput.needsManualInput = false;
    currentNeedInput.weather = weather;

    if (currentIndex + 1 >= needsInput.length) {
      onComplete(pendingPhotos);
    } else {
      setCurrentIndex(currentIndex + 1);
      setCityName('');
      setWeather('sunny');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px'
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#2d2d44',
          borderRadius: '16px',
          padding: '28px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#e0e0ff' }}>
          补充照片信息 ({currentIndex + 1} / {needsInput.length})
        </h3>
        <p style={{ color: '#8080a0', fontSize: '13px', marginBottom: '20px' }}>
          部分照片没有EXIF数据，请手动补充信息
        </p>

        <div style={{ marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#1e1e2e' }}>
          <img
            src={currentNeedInput.dataUrl}
            alt="预览"
            style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', display: 'block' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#a0a0c0', marginBottom: '6px', fontWeight: 500 }}>
            拍摄城市
          </label>
          <input
            type="text"
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            placeholder="如：北京市"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#6c5ce7')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#3d3d5c')}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#a0a0c0', marginBottom: '6px', fontWeight: 500 }}>
            拍摄时间
          </label>
          <input
            type="datetime-local"
            value={captureTime}
            onChange={(e) => setCaptureTime(e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#6c5ce7')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#3d3d5c')}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#a0a0c0', marginBottom: '10px', fontWeight: 500 }}>
            天气情况
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {weatherOptions.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeather(w)}
                style={{
                  flex: 1,
                  padding: '14px 12px',
                  backgroundColor: weather === w ? 'rgba(108, 92, 231, 0.2)' : '#1e1e2e',
                  border: weather === w ? '2px solid #6c5ce7' : '1px solid #3d3d5c',
                  borderRadius: '10px',
                  color: '#e0e0ff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  if (weather !== w) e.currentTarget.style.borderColor = '#4d4d6c';
                }}
                onMouseLeave={(e) => {
                  if (weather !== w) e.currentTarget.style.borderColor = '#3d3d5c';
                }}
              >
                <span style={{ fontSize: '24px' }}>{weatherIcons[w].icon}</span>
                <span style={{ fontSize: '12px', color: weather === w ? '#a29bfe' : '#8080a0' }}>
                  {weatherIcons[w].label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: '1px solid #3d3d5c',
              color: '#e0e0ff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3d3d5c')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            取消上传
          </button>
          <button
            onClick={handleNext}
            style={btnHover ? buttonHover : buttonStyle}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
          >
            {currentIndex + 1 >= needsInput.length ? '完成' : '下一张'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PhotoTimeline({ tripId }: { tripId: string }) {
  const trip = useTravelStore((s) => s.getTripById(tripId));
  const photos = useTravelStore((s) => s.getPhotosByTripId(tripId));
  const addPhotos = useTravelStore((s) => s.addPhotos);
  const deletePhoto = useTravelStore((s) => s.deletePhoto);
  const updatePhoto = useTravelStore((s) => s.updatePhoto);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [btnHover, setBtnHover] = useState(false);

  const dayGroups = useMemo(() => groupByDate(photos), [photos]);

  const processFiles = useCallback(
    async (files: FileList) => {
      const validFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (!/\.(jpg|jpeg|png)$/i.test(f.name)) {
          console.warn(`跳过非图片文件: ${f.name}`);
          continue;
        }
        if (f.size > 5 * 1024 * 1024) {
          alert(`文件 ${f.name} 超过5MB，已跳过`);
          continue;
        }
        validFiles.push(f);
      }

      if (validFiles.length === 0) {
        alert('没有有效的图片文件');
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      const EXIF_WHITELIST = [
        'DateTimeOriginal',
        'CreateDate',
        'ModifyDate',
        'GPSLatitude',
        'GPSLongitude',
        'GPSLatitudeRef',
        'GPSLongitudeRef'
      ];

      const BATCH_SIZE = 3;
      const pending: PendingPhoto[] = [];
      const total = validFiles.length;

      try {
        for (let batchStart = 0; batchStart < total; batchStart += BATCH_SIZE) {
          const batchEnd = Math.min(batchStart + BATCH_SIZE, total);
          const batch = validFiles.slice(batchStart, batchEnd);

          const batchResults = await Promise.all(
            batch.map(async (file) => {
              const dataUrl = await fileToDataUrl(file);

              let captureTime: Date | null = null;
              let latitude: number | null = null;
              let longitude: number | null = null;

              try {
                const exifData = await exifr.parse(file, EXIF_WHITELIST);
                if (exifData) {
                  if (exifData.DateTimeOriginal) {
                    captureTime = new Date(exifData.DateTimeOriginal);
                  } else if (exifData.CreateDate) {
                    captureTime = new Date(exifData.CreateDate);
                  } else if (exifData.ModifyDate) {
                    captureTime = new Date(exifData.ModifyDate);
                  }
                  if (exifData.GPSLatitude !== undefined && exifData.GPSLongitude !== undefined) {
                    latitude = exifData.GPSLatitude;
                    longitude = exifData.GPSLongitude;
                  }
                }
              } catch {
                // EXIF解析失败，继续使用空数据
              }

              const needsManualInput = !captureTime;

              return {
                file,
                dataUrl,
                captureTime: captureTime ? captureTime.toISOString() : null,
                latitude,
                longitude,
                needsManualInput
              } as PendingPhoto;
            })
          );

          pending.push(...batchResults);

          const progress = Math.round((batchEnd / total) * 85);
          setUploadProgress(progress);

          if (batchEnd < total) {
            await new Promise((r) => setTimeout(r, 0));
          }
        }

        setUploadProgress(90);

        const hasMissing = pending.some((p) => p.needsManualInput);
        if (hasMissing) {
          setPendingPhotos(pending);
          setUploading(false);
          setUploadProgress(100);
          return;
        }

        await new Promise((r) => setTimeout(r, 0));
        setUploadProgress(95);
        finalizeUpload(pending);
      } catch (err) {
        console.error('上传处理失败:', err);
        alert('上传处理失败，请重试');
        setUploading(false);
        setUploadProgress(0);
      }
    },
    []
  );

  const finalizeUpload = useCallback(
    (pending: PendingPhoto[]) => {
      const newPhotos: Omit<Photo, 'id'>[] = pending.map((p) => {
        let cityName = p.cityName || trip?.destinationCity || '未知城市';
        const weather = p.weather || randomWeather();
        return {
          tripId,
          dataUrl: p.dataUrl,
          fileName: p.file.name,
          captureTime: p.captureTime || new Date().toISOString(),
          latitude: p.latitude,
          longitude: p.longitude,
          cityName,
          weather
        };
      });

      addPhotos(newPhotos);
      setUploading(false);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 800);
      setPendingPhotos(null);
    },
    [addPhotos, tripId, trip]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  const cardBaseStyle: React.CSSProperties = {
    backgroundColor: '#2d2d44',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
    position: 'relative'
  };

  const cardHoverStyle: React.CSSProperties = {
    ...cardBaseStyle,
    transform: 'translateY(-3px)',
    boxShadow: '0 10px 40px rgba(108, 92, 231, 0.25)'
  };

  return (
    <div>
      <div
        style={{
          backgroundColor: '#2d2d44',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '28px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#e0e0ff', marginBottom: '4px' }}>
              📸 照片时间线
            </h2>
            <p style={{ color: '#8080a0', fontSize: '13px' }}>
              共 {photos.length} 张照片，{dayGroups.length} 个拍摄日
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {uploading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="spinner" />
                <div style={{ minWidth: '120px', height: '6px', backgroundColor: '#1e1e2e', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${uploadProgress}%`,
                      background: 'linear-gradient(90deg, #6c5ce7, #a29bfe)',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
                <span style={{ fontSize: '13px', color: '#a0a0c0' }}>{uploadProgress}%</span>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                ...(btnHover ? buttonHover : buttonStyle),
                opacity: uploading ? 0.6 : 1,
                cursor: uploading ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
            >
              📤 上传照片
            </button>
          </div>
        </div>
        <p style={{ color: '#606080', fontSize: '12px', marginTop: '12px' }}>
          支持 JPG/PNG 格式，每张不超过 5MB。系统将自动提取 EXIF 中的拍摄时间和 GPS 坐标。
        </p>
      </div>

      {pendingPhotos && (
        <MissingDataModal
          pendingPhotos={pendingPhotos}
          onComplete={finalizeUpload}
          onCancel={() => {
            setPendingPhotos(null);
            setUploading(false);
            setUploadProgress(0);
          }}
        />
      )}

      {dayGroups.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            backgroundColor: '#2d2d44',
            borderRadius: '12px'
          }}
        >
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📷</div>
          <h3 style={{ fontSize: '18px', color: '#e0e0ff', marginBottom: '8px' }}>还没有照片</h3>
          <p style={{ color: '#8080a0', fontSize: '14px' }}>点击"上传照片"按钮开始记录旅行记忆吧</p>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: '19px',
              top: '20px',
              bottom: '20px',
              width: '2px',
              background: 'linear-gradient(180deg, #6c5ce7 0%, #a29bfe 100%)',
              opacity: 0.3
            }}
          />

          {dayGroups.map((group) => (
            <div key={group.date} style={{ marginBottom: '32px', position: 'relative', paddingLeft: '48px' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '8px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                  border: '3px solid #1e1e2e',
                  zIndex: 1
                }}
              />
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: '#3d3d5c',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#e0e0ff',
                  marginBottom: '16px'
                }}
              >
                {format(new Date(group.date), 'yyyy年M月d日 EEEE', { locale: zhCN })}
                <span style={{ marginLeft: '8px', color: '#a29bfe' }}>({group.photos.length}张)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {group.photos.map((photo, idx) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    index={idx}
                    cardBase={cardBaseStyle}
                    cardHover={cardHoverStyle}
                    onDelete={() => {
                      if (window.confirm('确定删除这张照片吗？')) deletePhoto(photo.id);
                    }}
                    onUpdateWeather={(weather) => updatePhoto(photo.id, { weather })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoCard({
  photo,
  index,
  cardBase,
  cardHover,
  onDelete,
  onUpdateWeather
}: {
  photo: Photo;
  index: number;
  cardBase: React.CSSProperties;
  cardHover: React.CSSProperties;
  onDelete: () => void;
  onUpdateWeather: (weather: Weather) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [weatherMenuOpen, setWeatherMenuOpen] = useState(false);

  return (
    <div
      className="slide-up"
      style={{
        ...(hovered ? cardHover : cardBase),
        animationDelay: `${index * 0.03}s`
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setWeatherMenuOpen(false);
      }}
    >
      <div style={{ position: 'relative', paddingTop: '66.67%', overflow: 'hidden', backgroundColor: '#1e1e2e' }}>
        <img
          src={photo.dataUrl}
          alt={photo.fileName}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)'
          }}
          loading="lazy"
        />
        {hovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 107, 129, 0.9)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              zIndex: 2
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title="删除照片"
          >
            ×
          </button>
        )}
      </div>
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e0e0ff' }}>
            📍 {photo.cityName}
          </span>
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setWeatherMenuOpen(!weatherMenuOpen);
              }}
              title={`${weatherIcons[photo.weather].label}（点击修改）`}
              style={{
                fontSize: '18px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '6px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(108, 92, 231, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {weatherIcons[photo.weather].icon}
            </button>
            {weatherMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '4px',
                  backgroundColor: '#2d2d44',
                  border: '1px solid #3d3d5c',
                  borderRadius: '10px',
                  padding: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  zIndex: 10,
                  display: 'flex',
                  gap: '6px'
                }}
              >
                {weatherOptions.map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      onUpdateWeather(w);
                      setWeatherMenuOpen(false);
                    }}
                    title={weatherIcons[w].label}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: photo.weather === w ? 'rgba(108, 92, 231, 0.25)' : '#1e1e2e',
                      border: photo.weather === w ? '2px solid #6c5ce7' : '1px solid #3d3d5c',
                      cursor: 'pointer',
                      fontSize: '20px',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#a29bfe')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor =
                        photo.weather === w ? '#6c5ce7' : '#3d3d5c')
                    }
                  >
                    {weatherIcons[w].icon}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <span style={{ fontSize: '12px', color: '#8080a0' }}>
          {format(new Date(photo.captureTime), 'HH:mm')}
          {photo.latitude != null && photo.longitude != null && (
            <span style={{ marginLeft: '8px', color: '#6c5ce7' }}>● GPS</span>
          )}
        </span>
      </div>
    </div>
  );
}
