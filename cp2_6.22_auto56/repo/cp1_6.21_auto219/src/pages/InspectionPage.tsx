import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { inspectionAPI, deviceAPI } from '@/services/inspectionAPI';
import { orderAPI } from '@/services/orderAPI';
import type { Device, Inspection } from '@/types';

const INSPECTION_ITEMS = ['温度', '压力', '噪音', '振动', '外观'];

const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const validateImage = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      resolve(false);
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (img.width > 1920 || img.height > 1080) {
        resolve(false);
        return;
      }
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(file);
  });
};

const InspectionPage: React.FC = () => {
  const { currentUser, showNotification } = useApp();

  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [showDeviceSuggestions, setShowDeviceSuggestions] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  const [checkedItems, setCheckedItems] = useState<string[]>([...INSPECTION_ITEMS]);
  const [abnormalItems, setAbnormalItems] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterDeviceSearch, setFilterDeviceSearch] = useState('');
  const [filterSuggestions, setFilterSuggestions] = useState<Device[]>([]);
  const [showFilterSuggestions, setShowFilterSuggestions] = useState(false);
  const filterSearchTimer = useRef<NodeJS.Timeout | null>(null);

  const loadDevices = useCallback(async (keyword?: string) => {
    try {
      const data = await deviceAPI.list(keyword);
      return data;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    loadDevices().then(setDevices);
    fetchInspections();
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      if (deviceSearch.trim()) {
        const data = await loadDevices(deviceSearch);
        setDevices(data);
        setShowDeviceSuggestions(true);
      } else {
        const data = await loadDevices();
        setDevices(data);
        setShowDeviceSuggestions(false);
      }
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [deviceSearch, loadDevices]);

  useEffect(() => {
    if (filterSearchTimer.current) clearTimeout(filterSearchTimer.current);
    filterSearchTimer.current = setTimeout(async () => {
      if (filterDeviceSearch.trim()) {
        const data = await loadDevices(filterDeviceSearch);
        setFilterSuggestions(data);
        setShowFilterSuggestions(true);
      } else {
        setFilterSuggestions([]);
        setShowFilterSuggestions(false);
      }
    }, 300);
    return () => {
      if (filterSearchTimer.current) clearTimeout(filterSearchTimer.current);
    };
  }, [filterDeviceSearch, loadDevices]);

  const fetchInspections = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      if (filterDeviceSearch.trim()) params.search = filterDeviceSearch.trim();
      const data = await inspectionAPI.list(params);
      setInspections(data);
    } catch (e) {
      showNotification('加载巡检记录失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterStartDate, filterEndDate, filterDeviceSearch, showNotification]);

  useEffect(() => {
    fetchInspections();
  }, [filterStartDate, filterEndDate, filterDeviceSearch]);

  const toggleCheckedItem = (item: string) => {
    setCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
    setAbnormalItems((prev) => prev.filter((x) => x !== item));
  };

  const toggleAbnormalItem = (item: string) => {
    if (!checkedItems.includes(item)) return;
    setAbnormalItems((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 3 - photos.length);
    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const file of newFiles) {
      const valid = await validateImage(file);
      if (!valid) {
        showNotification(
          `${file.name} 不符合要求（仅JPG/PNG，尺寸≤1920x1080）`,
          'error'
        );
        continue;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setPhotos((prev) => [...prev, ...validFiles].slice(0, 3));
    setPhotoPreviews((prev) => [...prev, ...validPreviews].slice(0, 3));
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!selectedDevice) {
      showNotification('请选择巡检设备', 'error');
      return;
    }
    if (checkedItems.length === 0) {
      showNotification('请至少选择一项巡检项', 'error');
      return;
    }
    if (description.length > 200) {
      showNotification('异常描述不能超过200字', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress(0);

      const newRecord = await inspectionAPI.create({
        deviceId: selectedDevice.id,
        deviceName: selectedDevice.name,
        userId: currentUser.id,
        items: checkedItems,
        abnormalItems,
        description,
        photos,
        onUploadProgress: (e) => {
          if (e.total) {
            setUploadProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      });

      if (abnormalItems.length > 0) {
        try {
          await orderAPI.create({
            inspectionId: newRecord.id,
            deviceId: selectedDevice.id,
            deviceName: selectedDevice.name,
            description: description || `异常项: ${abnormalItems.join('、')}`,
            creatorId: currentUser.id,
          });
        } catch (e) {
          console.warn('自动创建工单失败', e);
        }
      }

      showNotification('巡检记录提交成功！');
      setSelectedDevice(null);
      setDeviceSearch('');
      setCheckedItems([...INSPECTION_ITEMS]);
      setAbnormalItems([]);
      setDescription('');
      photoPreviews.forEach((p) => URL.revokeObjectURL(p));
      setPhotos([]);
      setPhotoPreviews([]);
      setUploadProgress(0);
      fetchInspections();
    } catch (e: any) {
      showNotification(
        e?.response?.data?.error || '提交失败，请重试',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectDevice = (device: Device) => {
    setSelectedDevice(device);
    setDeviceSearch(device.name);
    setShowDeviceSuggestions(false);
  };

  const canSubmit = useMemo(
    () => !!selectedDevice && checkedItems.length > 0 && !isSubmitting,
    [selectedDevice, checkedItems, isSubmitting]
  );

  return (
    <div>
      <h1 className="page-title">📋 巡检录入</h1>

      <div className="card mb-24">
        <div className="row">
          <div className="col">
            <div className="form-group">
              <label className="form-label">选择设备</label>
              <div className="search-dropdown">
                <input
                  type="search"
                  placeholder="输入设备名搜索或从下拉选择..."
                  value={deviceSearch}
                  onChange={(e) => {
                    setDeviceSearch(e.target.value);
                    if (selectedDevice) setSelectedDevice(null);
                  }}
                  onFocus={() => setShowDeviceSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowDeviceSuggestions(false), 200)
                  }
                />
                {showDeviceSuggestions && devices.length > 0 && (
                  <div className="search-suggestions">
                    {devices.map((d) => (
                      <div
                        key={d.id}
                        className="search-suggestion-item"
                        onMouseDown={() => selectDevice(d)}
                      >
                        <div style={{ color: '#1E293B', fontWeight: 600 }}>
                          {d.name.length > 20
                            ? d.name.slice(0, 20) + '...'
                            : d.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#94A3B8' }}>
                          {d.id}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedDevice && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: '#10B981',
                    fontWeight: 600,
                  }}
                >
                  ✓ 已选择：{selectedDevice.name}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">巡检项（勾选需要巡检的项目）</label>
          <div className="checkbox-group">
            {INSPECTION_ITEMS.map((item) => (
              <label
                key={item}
                className={`checkbox-item ${
                  checkedItems.includes(item) ? 'checked' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={checkedItems.includes(item)}
                  onChange={() => toggleCheckedItem(item)}
                  style={{ width: 16, height: 16 }}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        {checkedItems.length > 0 && (
          <div className="form-group">
            <label className="form-label">标记异常项（如有）</label>
            <div className="checkbox-group">
              {checkedItems.map((item) => (
                <label
                  key={item}
                  className={`checkbox-item ${
                    abnormalItems.includes(item) ? 'checked' : ''
                  }`}
                  style={{
                    borderColor: abnormalItems.includes(item)
                      ? '#EF4444'
                      : undefined,
                    background: abnormalItems.includes(item)
                      ? '#FEF2F2'
                      : undefined,
                    color: abnormalItems.includes(item)
                      ? '#DC2626'
                      : undefined,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={abnormalItems.includes(item)}
                    onChange={() => toggleAbnormalItem(item)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">
            异常描述
            <span style={{ fontWeight: 400, color: '#94A3B8', marginLeft: 6 }}>
              ({description.length}/200)
            </span>
          </label>
          <textarea
            placeholder="请描述异常情况（最多200字）..."
            value={description}
            onChange={(e) =>
              setDescription(e.target.value.slice(0, 200))
            }
            rows={4}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            现场照片
            <span style={{ fontWeight: 400, color: '#94A3B8', marginLeft: 6 }}>
              (最多3张，JPG/PNG，≤1920x1080)
            </span>
          </label>
          <div
            className={`upload-area ${isDragging ? 'dragging' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
            <div style={{ color: '#475569', fontWeight: 500 }}>
              点击或拖拽图片到此处上传
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
              已上传 {photos.length}/3 张
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFilesSelected(e.target.files)}
          />

          {photoPreviews.length > 0 && (
            <div className="upload-preview">
              {photoPreviews.map((src, i) => (
                <div key={i} className="upload-preview-item">
                  <img src={src} alt={`预览${i + 1}`} />
                  <button
                    className="upload-preview-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(i);
                    }}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="upload-progress">
              <div
                className="upload-progress-bar"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              padding: '12px 32px',
              fontSize: 15,
              borderRadius: 8,
            }}
          >
            {isSubmitting
              ? `提交中 ${uploadProgress}%...`
              : '提交巡检记录'}
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-dropdown">
          <input
            type="search"
            placeholder="🔍 按设备名称搜索..."
            value={filterDeviceSearch}
            onChange={(e) => setFilterDeviceSearch(e.target.value)}
            onFocus={() => filterSuggestions.length > 0 && setShowFilterSuggestions(true)}
            onBlur={() => setTimeout(() => setShowFilterSuggestions(false), 200)}
          />
          {showFilterSuggestions && filterSuggestions.length > 0 && (
            <div className="search-suggestions">
              {filterSuggestions.map((d) => (
                <div
                  key={d.id}
                  className="search-suggestion-item"
                  onMouseDown={() => {
                    setFilterDeviceSearch(d.name);
                    setShowFilterSuggestions(false);
                  }}
                >
                  {d.name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="date-range">
          <input
            type="date"
            placeholder="开始日期"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
          />
          <span style={{ color: '#94A3B8' }}>至</span>
          <input
            type="date"
            placeholder="结束日期"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
          />
        </div>
        {(filterStartDate || filterEndDate || filterDeviceSearch) && (
          <button
            type="button"
            onClick={() => {
              setFilterStartDate('');
              setFilterEndDate('');
              setFilterDeviceSearch('');
            }}
            style={{
              flex: '0 0 auto',
              minWidth: 'auto',
              background: '#F1F5F9',
              color: '#475569',
              border: '1px solid #E2E8F0',
              padding: '10px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            清除筛选
          </button>
        )}
      </div>

      <div className="flex-between">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>
          巡检记录
          <span style={{ fontSize: 14, fontWeight: 400, color: '#94A3B8', marginLeft: 8 }}>
            共 {inspections.length} 条
          </span>
        </h2>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div>加载中...</div>
        </div>
      ) : inspections.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div>暂无巡检记录</div>
        </div>
      ) : (
        <div className="inspection-list">
          {inspections.map((record) => (
            <div key={record.id} className="inspection-card">
              <div className="inspection-card-header">
                <div className="inspection-card-device">
                  {record.deviceName}
                </div>
                {record.abnormalItems.length === 0 ? (
                  <span className="status-dot ok">✓</span>
                ) : (
                  <span className="status-dot bad">
                    {record.abnormalItems.length}
                  </span>
                )}
              </div>
              <div className="inspection-card-time">
                🕐 {formatDateTime(record.createdAt)}
              </div>
              <div className="inspection-card-body">
                <div style={{ marginBottom: 6 }}>
                  <strong>巡检项：</strong>
                  {record.items.join('、')}
                </div>
                {record.abnormalItems.length > 0 && (
                  <div style={{ color: '#DC2626', marginBottom: 6 }}>
                    <strong>异常：</strong>
                    {record.abnormalItems.join('、')}
                  </div>
                )}
                {record.description && (
                  <div style={{ color: '#475569' }}>
                    <strong>描述：</strong>
                    {record.description}
                  </div>
                )}
                {record.photos.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      marginTop: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    {record.photos.map((p, i) => (
                      <img
                        key={i}
                        src={p}
                        alt=""
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 6,
                          objectFit: 'cover',
                          border: '1px solid #E2E8F0',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InspectionPage;
