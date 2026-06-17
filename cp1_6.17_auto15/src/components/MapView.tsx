import React, { useEffect, useState, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import { Button, Input, Modal, message, List, Tag } from 'antd';
import { DeleteOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useMapStore } from '../store/mapStore';
import { useTravelogStore } from '../store/travelogStore';
import { formatDateTime } from '../utils/format';
import type { Checkin } from '../types';
import L from 'leaflet';

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
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
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
    setCurrentPosition,
  } = useMapStore();

  const { createTravelog, fetchTravelogs } = useTravelogStore();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newCheckinName, setNewCheckinName] = useState('');
  const [clickedPosition, setClickedPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [travelogModalVisible, setTravelogModalVisible] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null);
  const [travelogTitle, setTravelogTitle] = useState('');
  const [travelogContent, setTravelogContent] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    fetchCheckins();
    fetchTravelogs();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        () => {
          console.log('无法获取地理位置，使用默认位置');
        }
      );
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

    const result = await addCheckin(
      newCheckinName.trim(),
      clickedPosition.lat,
      clickedPosition.lng
    );

    if (result) {
      message.success('签到成功！');
      setAddModalVisible(false);
      setNewCheckinName('');
      setClickedPosition(null);
    }
  };

  const handleDeleteCheckin = async (id: string, name: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除签到点"${name}"吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await deleteCheckin(id);
        message.success('删除成功');
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

    const result = await createTravelog(travelogTitle.trim(), travelogContent.trim(), [
      selectedCheckin.id,
    ]);

    if (result) {
      message.success('游记创建成功！');
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

  const center: [number, number] = [currentPosition.lat, currentPosition.lng];

  return (
    <div style={styles.container}>
      <div style={styles.mapContainer}>
        <MapContainer
          center={center}
          zoom={currentPosition.zoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={center} zoom={currentPosition.zoom} />
          <MapClickHandler onMapClick={handleMapClick} />

          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationIcon}
            >
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <strong>我的位置</strong>
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
              <Popup>
                <div style={styles.popupContent}>
                  <h3 style={styles.popupTitle}>{checkin.name}</h3>
                  <p style={styles.popupTime}>
                    {formatDateTime(checkin.createdAt)}
                  </p>
                  <div style={styles.popupButtons}>
                    <Button
                      type="primary"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleGenerateTravelog(checkin)}
                      style={styles.popupButton}
                    >
                      生成游记
                    </Button>
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteCheckin(checkin.id, checkin.name)}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
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
              <p style={{ color: '#999' }}>点击地图添加签到点</p>
            </div>
          ) : (
            <List
              dataSource={sortedCheckins}
              renderItem={(item) => (
                <List.Item key={item.id} className="list-item" style={styles.listItem}>
                  <List.Item.Meta
                    title={<span style={styles.listItemTitle}>{item.name}</span>}
                    description={
                      <span style={styles.listItemTime}>
                        {formatDateTime(item.createdAt)}
                      </span>
                    }
                  />
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handleGenerateTravelog(item)}
                    style={styles.generateButton}
                  >
                    生成游记
                  </Button>
                </List.Item>
              )}
            />
          )}
        </div>
      </div>

      <Modal
        title="添加签到点"
        open={addModalVisible}
        onOk={handleAddCheckin}
        onCancel={() => setAddModalVisible(false)}
        okText="确认签到"
        cancelText="取消"
        centered
      >
        <div style={{ marginTop: 16 }}>
          <Input
            placeholder="请输入签到名称（最多20字）"
            value={newCheckinName}
            onChange={(e) => setNewCheckinName(e.target.value.slice(0, 20))}
            maxLength={20}
            showCount
            size="large"
          />
          {clickedPosition && (
            <p style={{ marginTop: 12, color: '#666', fontSize: 12 }}>
              坐标: {clickedPosition.lat.toFixed(6)},{' '}
              {clickedPosition.lng.toFixed(6)}
            </p>
          )}
        </div>
      </Modal>

      <Modal
        title="生成游记"
        open={travelogModalVisible}
        onOk={handleSaveTravelog}
        onCancel={() => setTravelogModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={640}
        centered
        footer={[
          <Button key="preview" onClick={handlePreview}>
            预览
          </Button>,
          <Button key="cancel" onClick={() => setTravelogModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleSaveTravelog}>
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
                <p style={{ fontWeight: 600, color: '#1A237E' }}>
                  {selectedCheckin.name}
                </p>
                <p style={{ fontSize: 12, color: '#999' }}>
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
  mapContainer: {
    flex: 1,
    height: '100%',
    position: 'relative' as const,
    minWidth: 0,
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
    transition: 'box-shadow 0.2s ease',
    cursor: 'pointer',
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
  generateButton: {
    background: '#1976D2',
    borderColor: '#1976D2',
    borderRadius: 4,
    fontSize: 12,
  },
  popupContent: {
    padding: 8,
    minWidth: 160,
  },
  popupTitle: {
    margin: '0 0 4px 0',
    color: '#1A237E',
    fontSize: 14,
  },
  popupTime: {
    margin: '0 0 8px 0',
    color: '#666',
    fontSize: 12,
  },
  popupButtons: {
    display: 'flex',
    gap: 8,
    justifyContent: 'space-between',
  },
  popupButton: {
    flex: 1,
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
