import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import { Button, Input, Modal, message, List, Tag, Divider } from 'antd';
import {
  DeleteOutlined,
  PlusOutlined,
  EditOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useMapStore } from '../store/mapStore';
import { useTravelogStore } from '../store/travelogStore';
import { formatDateTime } from '../utils/format';
import type { Checkin } from '../types';
import L from 'leaflet';

const DEFAULT_CENTER = { lat: 39.9042, lng: 116.4074 };
const DEFAULT_ZOOM = 13;

const blueDropIcon = L.divIcon({
  className: 'custom-drop-marker',
  html: `
    <div style="
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid #fff;
      box-shadow: 0 3px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 14px;
        height: 14px;
        background: #fff;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="
      width: 24px;
      height: 24px;
      background: #2196F3;
      border-radius: 50%;
      border: 4px solid #fff;
      box-shadow: 0 0 0 6px rgba(33, 150, 243, 0.3);
      animation: pulse 2s ease-in-out infinite;
    "></div>
    <style>
      @keyframes pulse {
        0%, 100% { box-shadow: 0 0 0 6px rgba(33, 150, 243, 0.3); }
        50% { box-shadow: 0 0 0 12px rgba(33, 150, 243, 0.1); }
      }
    </style>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

interface MapControllerProps {
  center: [number, number];
  zoom: number;
}

const MapController: React.FC<MapControllerProps> = ({ center, zoom }) => {
  const map = useMap();
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      map.setView(center, zoom);
      isFirstRender.current = false;
    }
  }, [center, zoom, map]);
  return null;
};

const CheckinPopup: React.FC<{
  checkin: Checkin;
  onGenerateTravelog: (checkin: Checkin) => void;
  onDelete: (id: string, name: string) => void;
}> = ({ checkin, onGenerateTravelog, onDelete }) => {
  const [popupVisible, setPopupVisible] = useState(true);

  return (
    <Popup closeButton={true} maxWidth={240}>
      <div style={popupStyles.container}>
        <div style={popupStyles.header}>
          <EnvironmentOutlined style={popupStyles.headerIcon} />
          <h3 style={popupStyles.title}>{checkin.name}</h3>
        </div>
        <p style={popupStyles.time}>
          <CheckCircleOutlined style={{ marginRight: 4, color: '#1976D2' }} />
          {formatDateTime(checkin.createdAt)}
        </p>
        <Divider style={{ margin: '8px 0' }} />
        <div style={popupStyles.buttons}>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onGenerateTravelog(checkin)}
            style={popupStyles.generateBtn}
          >
            生成游记
          </Button>
          <Button
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => {
              onDelete(checkin.id, checkin.name);
            }}
            style={popupStyles.deleteBtn}
            danger
          >
            删除
          </Button>
        </div>
      </div>
    </Popup>
  );
};

const popupStyles = {
  container: {
    padding: '4px 0',
    minWidth: 180,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  headerIcon: {
    color: '#1976D2',
    fontSize: 14,
  },
  title: {
    margin: 0,
    color: '#1A237E',
    fontSize: 15,
    fontWeight: 600,
  },
  time: {
    margin: '0 0 4px 0',
    color: '#666',
    fontSize: 12,
  },
  buttons: {
    display: 'flex',
    gap: 8,
  },
  generateBtn: {
    flex: 1,
    background: '#1976D2',
    borderColor: '#1976D2',
    borderRadius: 4,
  },
  deleteBtn: {
    flex: 1,
    borderRadius: 4,
    borderColor: '#D32F2F',
    color: '#D32F2F',
  },
};

const MapView: React.FC = () => {
  const {
    checkins,
    currentPosition,
    userLocation,
    fetchCheckins,
    addCheckin,
    deleteCheckin,
    setUserLocation,
  } = useMapStore();

  const { createTravelog, fetchTravelogs } = useTravelogStore();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newCheckinName, setNewCheckinName] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [clickedPosition, setClickedPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [travelogModalVisible, setTravelogModalVisible] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null);
  const [travelogTitle, setTravelogTitle] = useState('');
  const [travelogContent, setTravelogContent] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    fetchCheckins();
    fetchTravelogs();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapReady(true);
        },
        () => {
          setMapReady(true);
        },
        { timeout: 5000 }
      );
    } else {
      setMapReady(true);
    }
  }, [fetchCheckins, fetchTravelogs, setUserLocation]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickedPosition({ lat, lng });
    setNewCheckinName('');
    setAddModalVisible(true);
  }, []);

  const handleAddCheckin = async () => {
    if (!newCheckinName.trim()) {
      message.warning('请输入签到名称');
      return;
    }
    if (!clickedPosition) return;

    setAddLoading(true);
    const result = await addCheckin(
      newCheckinName.trim(),
      clickedPosition.lat,
      clickedPosition.lng
    );
    setAddLoading(false);

    if (result) {
      message.success(`签到成功！已在"${result.name}"标记位置`);
      setAddModalVisible(false);
      setNewCheckinName('');
      setClickedPosition(null);
    }
  };

  const handleDeleteCheckin = async (id: string, name: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除签到点"${name}"吗？删除后该位置标记将从地图上移除。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      okButtonProps: { style: { background: '#D32F2F', borderColor: '#D32F2F' } },
      onOk: async () => {
        await deleteCheckin(id);
        message.success('签到点已删除');
      },
    });
  };

  const handleGenerateTravelog = (checkin: Checkin) => {
    setSelectedCheckin(checkin);
    setTravelogTitle(checkin.name + '游记');
    setTravelogContent('');
    setTravelogModalVisible(true);
  };

  const handleSaveTravelog = async () => {
    if (!travelogTitle.trim()) {
      message.warning('请输入游记标题');
      return;
    }
    if (!travelogContent.trim()) {
      message.warning('请输入游记内容');
      return;
    }
    if (!selectedCheckin) return;

    setSaveLoading(true);
    const result = await createTravelog(
      travelogTitle.trim(),
      travelogContent.trim(),
      [selectedCheckin.id]
    );
    setSaveLoading(false);

    if (result) {
      message.success('游记创建成功！可在"我的游记"中查看');
      setTravelogModalVisible(false);
      setTravelogTitle('');
      setTravelogContent('');
      setSelectedCheckin(null);
    }
  };

  const handlePreview = () => {
    if (!travelogTitle.trim() || !travelogContent.trim()) {
      message.warning('请先填写标题和内容');
      return;
    }
    setPreviewVisible(true);
  };

  const sortedCheckins = [...checkins].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const center: [number, number] = [
    currentPosition.lat ?? DEFAULT_CENTER.lat,
    currentPosition.lng ?? DEFAULT_CENTER.lng,
  ];
  const zoom = currentPosition.zoom ?? DEFAULT_ZOOM;

  if (!mapReady) {
    return (
      <div style={styles.loadingOverlay}>
        <div style={styles.loadingContent}>
          <EnvironmentOutlined style={{ fontSize: 48, color: '#1A237E', marginBottom: 16 }} />
          <p style={{ color: '#666', fontSize: 16 }}>正在获取您的位置...</p>
          <p style={{ color: '#999', fontSize: 13, marginTop: 8 }}>
            默认位置：北京天安门（39.9042, 116.4074）
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.mapContainer}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={center} zoom={zoom} />
          <MapClickHandler onMapClick={handleMapClick} />

          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationIcon}
            >
              <Popup>
                <div style={{ textAlign: 'center', padding: '4px 0' }}>
                  <strong style={{ color: '#1A237E' }}>📍 我的位置</strong>
                  <br />
                  <span style={{ fontSize: 11, color: '#999' }}>
                    {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </span>
                </div>
              </Popup>
            </Marker>
          )}

          {checkins.map((checkin) => (
            <Marker
              key={checkin.id}
              position={[checkin.lat, checkin.lng]}
              icon={blueDropIcon}
            >
              <CheckinPopup
                checkin={checkin}
                onGenerateTravelog={handleGenerateTravelog}
                onDelete={handleDeleteCheckin}
              />
            </Marker>
          ))}
        </MapContainer>

        <div style={styles.mapHint}>
          <EnvironmentOutlined style={{ marginRight: 4 }} />
          点击地图任意位置添加签到点
        </div>
      </div>

      <div className="sidebar" style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>我的签到点</h2>
          <Tag color="blue" style={styles.checkinCount}>
            {checkins.length} 个
          </Tag>
        </div>

        <div style={styles.sidebarContent}>
          {sortedCheckins.length === 0 ? (
            <div style={styles.emptyState}>
              <PlusOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
              <p style={{ color: '#999', fontSize: 14 }}>点击地图添加签到点</p>
              <p style={{ color: '#bbb', fontSize: 12, marginTop: 4 }}>
                在地图上点击任意位置即可创建签到标记
              </p>
            </div>
          ) : (
            <List
              dataSource={sortedCheckins}
              renderItem={(item) => (
                <List.Item key={item.id} className="list-item" style={styles.listItem}>
                  <List.Item.Meta
                    avatar={
                      <div style={styles.listItemAvatar}>
                        <EnvironmentOutlined style={{ color: '#1976D2', fontSize: 16 }} />
                      </div>
                    }
                    title={<span style={styles.listItemTitle}>{item.name}</span>}
                    description={
                      <span style={styles.listItemTime}>
                        {formatDateTime(item.createdAt)}
                      </span>
                    }
                  />
                  <div style={styles.listItemActions}>
                    <Button
                      type="primary"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleGenerateTravelog(item)}
                      style={styles.generateButton}
                    >
                      生成游记
                    </Button>
                    <Button
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteCheckin(item.id, item.name)}
                      style={styles.deleteButton}
                      danger
                    />
                  </div>
                </List.Item>
              )}
            />
          )}
        </div>
      </div>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: '#1976D2' }} />
            <span>添加签到点</span>
          </div>
        }
        open={addModalVisible}
        onOk={handleAddCheckin}
        onCancel={() => {
          setAddModalVisible(false);
          setClickedPosition(null);
        }}
        okText="确认签到"
        cancelText="取消"
        centered
        confirmLoading={addLoading}
        okButtonProps={{ style: { background: '#1976D2', borderColor: '#1976D2' } }}
      >
        <div style={{ marginTop: 16 }}>
          <Input
            placeholder="请输入签到名称（最多20字）"
            value={newCheckinName}
            onChange={(e) => setNewCheckinName(e.target.value.slice(0, 20))}
            maxLength={20}
            showCount
            size="large"
            autoFocus
            prefix={<EnvironmentOutlined style={{ color: '#bbb' }} />}
            onPressEnter={handleAddCheckin}
          />
          {clickedPosition && (
            <div style={styles.coordInfo}>
              <span style={styles.coordLabel}>签到坐标</span>
              <span style={styles.coordValue}>
                {clickedPosition.lat.toFixed(6)}, {clickedPosition.lng.toFixed(6)}
              </span>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EditOutlined style={{ color: '#1976D2' }} />
            <span>生成游记</span>
          </div>
        }
        open={travelogModalVisible}
        onCancel={() => setTravelogModalVisible(false)}
        width={640}
        centered
        footer={[
          <Button key="preview" onClick={handlePreview} icon={<EditOutlined />}>
            预览
          </Button>,
          <Button key="cancel" onClick={() => setTravelogModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleSaveTravelog}
            loading={saveLoading}
            style={{ background: '#1976D2', borderColor: '#1976D2' }}
          >
            保存
          </Button>,
        ]}
      >
        <div style={{ padding: '16px 0', maxHeight: 400, overflowY: 'auto' }}>
          {selectedCheckin && (
            <div style={styles.travelogCheckinInfo}>
              <img
                src={selectedCheckin.imageUrl}
                alt={selectedCheckin.name}
                style={styles.travelogCheckinImage}
              />
              <div>
                <p style={{ fontWeight: 600, color: '#1A237E', margin: '0 0 4px 0' }}>
                  {selectedCheckin.name}
                </p>
                <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
                  {formatDateTime(selectedCheckin.createdAt)}
                </p>
              </div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <label style={styles.label}>游记标题</label>
            <Input
              placeholder="请输入游记标题（最多30字）"
              value={travelogTitle}
              onChange={(e) => setTravelogTitle(e.target.value.slice(0, 30))}
              maxLength={30}
              showCount
              size="large"
              style={{ marginTop: 8 }}
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={styles.label}>游记正文</label>
            <Input.TextArea
              placeholder="分享你的旅行故事..."
              value={travelogContent}
              onChange={(e) => setTravelogContent(e.target.value.slice(0, 500))}
              maxLength={500}
              showCount
              rows={8}
              autoSize={{ minRows: 6, maxRows: 12 }}
              style={{ marginTop: 8, resize: 'none' }}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="游记预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={700}
        centered
      >
        <div style={styles.previewContainer}>
          {selectedCheckin && (
            <img
              src={selectedCheckin.imageUrl}
              alt="封面"
              style={styles.previewCover}
            />
          )}
          <h2 style={styles.previewTitle}>{travelogTitle}</h2>
          <p style={styles.previewMeta}>
            {new Date().toLocaleDateString('zh-CN')} · 1个签到点
          </p>
          <div style={styles.previewContent}>{travelogContent}</div>
        </div>
      </Modal>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '100%',
    width: '100%',
    position: 'relative' as const,
  },
  loadingOverlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    background: '#f5f5f5',
  },
  loadingContent: {
    textAlign: 'center' as const,
  },
  mapContainer: {
    flex: 1,
    height: '100%',
    position: 'relative' as const,
    minWidth: 0,
  },
  mapHint: {
    position: 'absolute' as const,
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(26, 35, 126, 0.85)',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: 20,
    fontSize: 13,
    zIndex: 1000,
    pointerEvents: 'none' as const,
    backdropFilter: 'blur(4px)',
  },
  sidebar: {
    width: 320,
    background: '#FAFAFA',
    display: 'flex',
    flexDirection: 'column' as const,
    borderLeft: '1px solid #e8e8e8',
    flexShrink: 0,
  },
  sidebarHeader: {
    background: '#1A237E',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sidebarTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
  },
  checkinCount: {
    margin: 0,
  },
  sidebarContent: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '12px 16px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: 40,
  },
  listItem: {
    background: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    padding: '12px 16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
    cursor: 'pointer',
  },
  listItemAvatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#E3F2FD',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemTitle: {
    fontWeight: 600,
    color: '#1A237E',
    fontSize: 14,
  },
  listItemTime: {
    fontSize: 12,
    color: '#999',
  },
  listItemActions: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  generateButton: {
    background: '#1976D2',
    borderColor: '#1976D2',
    borderRadius: 4,
    fontSize: 12,
  },
  deleteButton: {
    borderRadius: 4,
    fontSize: 12,
  },
  coordInfo: {
    marginTop: 12,
    padding: '8px 12px',
    background: '#f5f5f5',
    borderRadius: 6,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordLabel: {
    fontSize: 12,
    color: '#999',
  },
  coordValue: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  travelogCheckinInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    background: '#f5f5f5',
    borderRadius: 8,
  },
  travelogCheckinImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    objectFit: 'cover' as const,
  },
  label: {
    fontWeight: 600,
    color: '#333',
    fontSize: 14,
  },
  previewContainer: {
    padding: 16,
  },
  previewCover: {
    width: '100%',
    height: 200,
    objectFit: 'cover' as const,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1A237E',
    marginBottom: 8,
  },
  previewMeta: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
  },
  previewContent: {
    fontSize: 15,
    lineHeight: 1.8,
    color: '#333',
    whiteSpace: 'pre-wrap' as const,
  },
};

export default MapView;
