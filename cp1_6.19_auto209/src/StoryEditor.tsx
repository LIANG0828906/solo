import React, { useState, useCallback, useMemo } from 'react';
import { Reorder, motion } from 'framer-motion';
import { Trash2, Calendar, MapPin, GripVertical, Plus, X } from 'lucide-react';
import { useStore } from './store';
import { Photo, formatDateTime, formatTime } from './utils';

const StoryEditor: React.FC = () => {
  const {
    photos,
    selectedPhotoIds,
    addPhotos,
    removePhoto,
    reorderPhotos,
    updatePhotoTime,
    updateGeoTag,
    selectPhoto,
    clearSelection,
    selectedPhotoId
  } = useStore((state) => ({
    photos: state.photos,
    selectedPhotoIds: state.selectedPhotoIds,
    addPhotos: state.addPhotos,
    removePhoto: state.removePhoto,
    reorderPhotos: state.reorderPhotos,
    updatePhotoTime: state.updatePhotoTime,
    updateGeoTag: state.updateGeoTag,
    selectPhoto: state.selectPhoto,
    clearSelection: state.clearSelection,
    selectedPhotoId: state.selectedPhotoIds[0] || null
  }));
  
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const selectedPhoto = useMemo(() => {
    return photos.find(p => p.id === selectedPhotoId) || null;
  }, [photos, selectedPhotoId]);
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addPhotos(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addPhotos]);
  
  const handlePhotoClick = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    selectPhoto(id, e.ctrlKey || e.metaKey);
  }, [selectPhoto]);
  
  const handleTimeSliderChange = useCallback((photoId: string, value: number) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;
    
    const newDate = new Date(photo.takenAt);
    const totalMinutesInDay = 24 * 60;
    const currentMinutes = newDate.getHours() * 60 + newDate.getMinutes();
    const newMinutes = (currentMinutes + value) % totalMinutesInDay;
    
    newDate.setHours(Math.floor(newMinutes / 60), newMinutes % 60, 0, 0);
    updatePhotoTime(photoId, newDate);
  }, [photos, updatePhotoTime]);
  
  const handleDateChange = useCallback((photoId: string, dateStr: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;
    
    const newDate = new Date(photo.takenAt);
    const [year, month, day] = dateStr.split('-').map(Number);
    newDate.setFullYear(year, month - 1, day);
    updatePhotoTime(photoId, newDate);
  }, [photos, updatePhotoTime]);
  
  const handleLocationSave = useCallback((photoId: string) => {
    const parts = locationInput.split(',');
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      const name = parts[2]?.trim();
      
      if (!isNaN(lat) && !isNaN(lng)) {
        updateGeoTag(photoId, lat, lng, name);
      }
    }
    setEditingLocationId(null);
    setLocationInput('');
  }, [locationInput, updateGeoTag]);
  
  const timeLineData = useMemo(() => {
    if (photos.length === 0) return { points: [], minTime: 0, maxTime: 0 };
    
    const sorted = [...photos].sort((a, b) => a.takenAt.getTime() - b.takenAt.getTime());
    const times = sorted.map(p => p.takenAt.getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    const points = sorted.map((photo, index) => ({
      photo,
      position: maxTime === minTime ? 50 : ((photo.takenAt.getTime() - minTime) / (maxTime - minTime)) * 100,
      index
    }));
    
    return { points, minTime, maxTime };
  }, [photos]);
  
  const generatePathD = useMemo(() => {
    if (timeLineData.points.length < 2) return '';
    
    const height = 60;
    const width = 100;
    
    let path = '';
    for (let i = 0; i < timeLineData.points.length; i++) {
      const point = timeLineData.points[i];
      const y = height / 2 + Math.sin(i * 0.5) * 15;
      
      if (i === 0) {
        path += `M ${point.position} ${y}`;
      } else {
        const prevPoint = timeLineData.points[i - 1];
        const prevY = height / 2 + Math.sin((i - 1) * 0.5) * 15;
        const cpX = (prevPoint.position + point.position) / 2;
        path += ` C ${cpX} ${prevY}, ${cpX} ${y}, ${point.position} ${y}`;
      }
    }
    
    return path;
  }, [timeLineData]);
  
  if (photos.length === 0) {
    return (
      <div style={styles.emptyContainer} onClick={() => fileInputRef.current?.click()}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.emptyContent}
        >
          <div style={styles.emptyIcon}>📸</div>
          <h2 style={styles.emptyTitle}>开始创建你的旅行故事</h2>
          <p style={styles.emptySubtitle}>点击上传照片，或拖拽照片到此处</p>
          <button style={styles.uploadButton} onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}>
            <Plus size={20} />
            <span>选择照片</span>
          </button>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div style={styles.container} onClick={clearSelection}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      
      <div style={styles.header}>
        <h2 style={styles.title}>照片排序与时间线编辑</h2>
        <button style={styles.addButton} onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}>
          <Plus size={18} />
          添加照片
        </button>
      </div>
      
      {selectedPhotoIds.length > 0 && (
        <div style={styles.selectionBar}>
          <span style={styles.selectionText}>
            已选择 {selectedPhotoIds.length} 张照片
          </span>
          <button
            style={styles.deleteSelectedButton}
            onClick={(e) => {
              e.stopPropagation();
              selectedPhotoIds.forEach(id => removePhoto(id));
              clearSelection();
            }}
          >
            <Trash2 size={16} />
            删除选中
          </button>
        </div>
      )}
      
      <Reorder.Group
        axis="x"
        values={photos}
        onReorder={(newOrder) => reorderPhotos(newOrder.map(p => p.id))}
        style={styles.photoGrid}
        onClick={(e) => e.stopPropagation()}
      >
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            isSelected={selectedPhotoIds.includes(photo.id)}
            isEditingTime={editingTimeId === photo.id}
            isEditingLocation={editingLocationId === photo.id}
            locationInput={locationInput}
            onPhotoClick={handlePhotoClick}
            onRemove={removePhoto}
            onStartEditTime={() => setEditingTimeId(photo.id)}
            onTimeSliderChange={(value) => handleTimeSliderChange(photo.id, value)}
            onDateChange={(dateStr) => handleDateChange(photo.id, dateStr)}
            onStartEditLocation={() => {
              setEditingLocationId(photo.id);
              setLocationInput(
                photo.latitude && photo.longitude
                  ? `${photo.latitude}, ${photo.longitude}${photo.locationName ? ', ' + photo.locationName : ''}`
                  : ''
              );
            }}
            onLocationInputChange={setLocationInput}
            onLocationSave={() => handleLocationSave(photo.id)}
            onCancelEdit={() => {
              setEditingTimeId(null);
              setEditingLocationId(null);
            }}
          />
        ))}
      </Reorder.Group>
      
      {photos.length > 1 && (
        <div style={styles.timelineContainer}>
          <h3 style={styles.timelineTitle}>时间线</h3>
          <div style={styles.timelineAxis}>
            <svg width="100%" height="80" viewBox="0 0 100 80" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4A90D9" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#4A90D9" stopOpacity="1" />
                </linearGradient>
              </defs>
              <path
                d={generatePathD}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            
            <div style={styles.timelinePoints}>
              {timeLineData.points.map(({ photo, position }) => (
                <div
                  key={photo.id}
                  style={{
                    ...styles.timelinePoint,
                    left: `${position}%`
                  }}
                  title={formatDateTime(photo.takenAt)}
                >
                  <div style={styles.timelineDot} />
                  <div style={styles.timelineLabel}>
                    {formatTime(photo.takenAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface PhotoCardProps {
  photo: Photo;
  isSelected: boolean;
  isEditingTime: boolean;
  isEditingLocation: boolean;
  locationInput: string;
  onPhotoClick: (id: string, e: React.MouseEvent) => void;
  onRemove: (id: string) => void;
  onStartEditTime: () => void;
  onTimeSliderChange: (value: number) => void;
  onDateChange: (dateStr: string) => void;
  onStartEditLocation: () => void;
  onLocationInputChange: (value: string) => void;
  onLocationSave: () => void;
  onCancelEdit: () => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  isSelected,
  isEditingTime,
  isEditingLocation,
  locationInput,
  onPhotoClick,
  onRemove,
  onStartEditTime,
  onTimeSliderChange,
  onDateChange,
  onStartEditLocation,
  onLocationInputChange,
  onLocationSave,
  onCancelEdit
}) => {
  const dateValue = photo.takenAt.toISOString().split('T')[0];
  
  return (
    <Reorder.Item
      value={photo}
      style={styles.photoCardWrapper}
    >
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        style={{
          ...styles.photoCard,
          borderColor: isSelected ? '#4A90D9' : '#E0E0E0'
        }}
        onClick={(e) => onPhotoClick(photo.id, e)}
      >
        <div style={styles.dragHandle}>
          <GripVertical size={16} color="#999" />
        </div>
        
        <img
          src={photo.url}
          alt="Photo"
          style={styles.photoImage}
          draggable={false}
        />
        
        <div style={styles.photoInfo}>
          <div style={styles.photoActions}>
            <button
              style={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                onStartEditTime();
              }}
              title="编辑时间"
            >
              <Calendar size={14} />
            </button>
            <button
              style={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                onStartEditLocation();
              }}
              title="编辑位置"
            >
              <MapPin size={14} />
            </button>
            <button
              style={{ ...styles.actionButton, color: '#FF6B6B' }}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(photo.id);
              }}
              title="删除照片"
            >
              <Trash2 size={14} />
            </button>
          </div>
          
          <div style={styles.dateStamp}>
            {formatDateTime(photo.takenAt)}
          </div>
          
          {photo.locationName && (
            <div style={styles.locationLabel}>
              📍 {photo.locationName}
            </div>
          )}
        </div>
        
        {isEditingTime && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={styles.editPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.editPanelHeader}>
              <span style={styles.editPanelTitle}>调整拍摄时间</span>
              <button style={styles.closeButton} onClick={onCancelEdit}>
                <X size={14} />
              </button>
            </div>
            <div style={styles.editPanelContent}>
              <label style={styles.editLabel}>日期</label>
              <input
                type="date"
                value={dateValue}
                onChange={(e) => onDateChange(e.target.value)}
                style={styles.dateInput}
              />
              <label style={styles.editLabel}>时间微调（分钟）</label>
              <input
                type="range"
                min="-60"
                max="60"
                defaultValue="0"
                onChange={(e) => onTimeSliderChange(parseInt(e.target.value))}
                style={styles.timeSlider}
              />
              <div style={styles.sliderLabels}>
                <span>-60分钟</span>
                <span>{formatTime(photo.takenAt)}</span>
                <span>+60分钟</span>
              </div>
            </div>
          </motion.div>
        )}
        
        {isEditingLocation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={styles.editPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.editPanelHeader}>
              <span style={styles.editPanelTitle}>设置地理位置</span>
              <button style={styles.closeButton} onClick={onCancelEdit}>
                <X size={14} />
              </button>
            </div>
            <div style={styles.editPanelContent}>
              <label style={styles.editLabel}>
                格式：纬度, 经度, 地名
              </label>
              <input
                type="text"
                value={locationInput}
                onChange={(e) => onLocationInputChange(e.target.value)}
                placeholder="39.9042, 116.4074, 北京"
                style={styles.locationInput}
              />
              <div style={styles.editButtons}>
                <button style={styles.cancelButton} onClick={onCancelEdit}>
                  取消
                </button>
                <button style={styles.saveButton} onClick={onLocationSave}>
                  保存
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </Reorder.Item>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    padding: '20px 0'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    margin: 0
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: '#4A90D9',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  selectionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'rgba(74, 144, 217, 0.1)',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  selectionText: {
    fontSize: '14px',
    color: '#4A90D9',
    fontWeight: '500'
  },
  deleteSelectedButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: '#FF6B6B',
    color: 'white',
    borderRadius: '6px',
    fontSize: '13px',
    border: 'none',
    cursor: 'pointer'
  },
  photoGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    listStyle: 'none',
    padding: 0,
    margin: 0,
    minHeight: '150px'
  },
  photoCardWrapper: {
    listStyle: 'none'
  },
  photoCard: {
    position: 'relative',
    width: '160px',
    height: 'auto',
    background: 'white',
    borderRadius: '8px',
    border: '2px solid #E0E0E0',
    overflow: 'visible',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)'
  },
  dragHandle: {
    position: 'absolute',
    top: '4px',
    left: '4px',
    zIndex: 10,
    padding: '4px',
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '4px',
    cursor: 'grab'
  },
  photoImage: {
    width: '160px',
    height: '120px',
    objectFit: 'cover',
    display: 'block',
    borderRadius: '6px 6px 0 0'
  },
  photoInfo: {
    padding: '8px',
    background: 'white',
    borderRadius: '0 0 6px 6px'
  },
  photoActions: {
    display: 'flex',
    gap: '4px',
    marginBottom: '6px'
  },
  actionButton: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F5F5F5',
    border: 'none',
    borderRadius: '4px',
    color: '#666',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  dateStamp: {
    fontSize: '11px',
    color: '#666',
    lineHeight: 1.4
  },
  locationLabel: {
    fontSize: '10px',
    color: '#4A90D9',
    marginTop: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  editPanel: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
    zIndex: 20,
    marginTop: '4px',
    overflow: 'hidden'
  },
  editPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#F5F5F5',
    borderBottom: '1px solid #E0E0E0'
  },
  editPanelTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#333'
  },
  closeButton: {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    color: '#999',
    cursor: 'pointer'
  },
  editPanelContent: {
    padding: '12px'
  },
  editLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#666',
    marginBottom: '4px'
  },
  dateInput: {
    width: '100%',
    padding: '6px 8px',
    fontSize: '12px',
    border: '1px solid #E0E0E0',
    borderRadius: '4px',
    marginBottom: '12px'
  },
  timeSlider: {
    width: '100%',
    marginBottom: '4px'
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: '#999'
  },
  locationInput: {
    width: '100%',
    padding: '6px 8px',
    fontSize: '12px',
    border: '1px solid #E0E0E0',
    borderRadius: '4px',
    marginBottom: '12px'
  },
  editButtons: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: '6px 12px',
    fontSize: '12px',
    background: '#F5F5F5',
    color: '#666',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  saveButton: {
    padding: '6px 12px',
    fontSize: '12px',
    background: '#4A90D9',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  timelineContainer: {
    marginTop: '32px',
    padding: '20px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)'
  },
  timelineTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 16px 0'
  },
  timelineAxis: {
    position: 'relative',
    width: '100%',
    height: '80px'
  },
  timelinePoints: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  timelinePoint: {
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  timelineDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#4A90D9',
    boxShadow: '0 0 0 3px rgba(74, 144, 217, 0.2)'
  },
  timelineLabel: {
    marginTop: '8px',
    fontSize: '10px',
    color: '#666',
    whiteSpace: 'nowrap'
  },
  emptyContainer: {
    width: '100%',
    minHeight: '400px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed #E0E0E0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  emptyContent: {
    textAlign: 'center',
    padding: '40px'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 8px 0'
  },
  emptySubtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 24px 0'
  },
  uploadButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: '#4A90D9',
    color: 'white',
    fontSize: '15px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

export default StoryEditor;
