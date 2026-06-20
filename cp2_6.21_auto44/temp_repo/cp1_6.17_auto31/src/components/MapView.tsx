import { useEffect, useState, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMapEvents,
} from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import { Modal, Input, Button, List, Typography, message } from 'antd';
import {
  EnvironmentOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useMapStore } from '@/store/mapStore';
import { useTravelogStore } from '@/store/travelogStore';
import { formatDateTime } from '@/utils/format';
import type { Checkin } from '@/types';
import TravelogEditor from './TravelogEditor';

const { Title, Text } = Typography;

const customIcon = new DivIcon({
  className: 'custom-drop-icon',
  html: `<div style="
    width: 32px;
    height: 32px;
    background: #1976D2;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 2px solid #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  "><span style="transform: rotate(45deg); color: #fff; font-size: 14px; font-weight: bold;">📍</span></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapView() {
  const {
    checkins,
    currentLocation,
    zoom,
    fetchCheckins,
    addCheckin,
    deleteCheckin,
    setCurrentLocation,
  } = useMapStore();
  const { fetchTravelogs } = useTravelogStore();
  const [inputModalOpen, setInputModalOpen] = useState(false);
  const [clickPosition, setClickPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [checkinName, setCheckinName] = useState('');
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null);

  useEffect(() => {
    fetchCheckins();
    fetchTravelogs();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position.coords.latitude, position.coords.longitude);
        },
        () => {
          console.log('无法获取位置，使用默认位置');
        }
      );
    }
  }, [fetchCheckins, fetchTravelogs, setCurrentLocation]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickPosition({ lat, lng });
    setCheckinName('');
    setInputModalOpen(true);
  }, []);

  const handleConfirmAdd = async () => {
    if (!checkinName.trim()) {
      message.warning('请输入签到点名称');
      return;
    }
    if (clickPosition) {
      await addCheckin(checkinName.trim(), clickPosition.lat, clickPosition.lng);
      message.success('签到成功！');
      setInputModalOpen(false);
      setClickPosition(null);
      setCheckinName('');
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个签到点吗？',
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
    setEditorModalOpen(true);
  };

  const sortedCheckins = [...checkins].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="map-view-container">
      <div className="map-wrapper">
        <MapContainer
          center={[currentLocation.lat, currentLocation.lng]}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onClick={handleMapClick} />

          <CircleMarker
            center={[currentLocation.lat, currentLocation.lng]}
            radius={10}
            pathOptions={{ color: '#1976D2', fillColor: '#1976D2', fillOpacity: 0.6 }}
          >
            <Popup>当前位置</Popup>
          </CircleMarker>

          {checkins.map((checkin) => (
            <Marker
              key={checkin.id}
              position={[checkin.lat, checkin.lng]}
              icon={customIcon}
            >
              <Popup>
                <div style={{ padding: '4px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {checkin.name}
                  </div>
                  <div style={{ color: '#666', fontSize: '12px', marginBottom: '8px' }}>
                    {formatDateTime(checkin.createdAt)}
                  </div>
                  <Button
                    type="primary"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(checkin.id)}
                    style={{ backgroundColor: '#D32F2F', borderColor: '#D32F2F' }}
                  >
                    删除
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="checkin-panel">
        <div className="checkin-panel-header">
          <EnvironmentOutlined style={{ marginRight: '8px' }} />
          我的签到点
        </div>
        <div className="checkin-panel-content">
          {sortedCheckins.length === 0 ? (
            <div className="empty-state">
              <PlusOutlined style={{ fontSize: '32px', color: '#bbb', marginBottom: '8px' }} />
              <div style={{ color: '#999' }}>点击地图添加签到点</div>
            </div>
          ) : (
            <List
              itemLayout="vertical"
              dataSource={sortedCheckins}
              renderItem={(item) => (
                <List.Item key={item.id} className="checkin-list-item">
                  <div className="checkin-item-name">{item.name}</div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {formatDateTime(item.createdAt)}
                  </Text>
                  <Button
                    type="primary"
                    size="small"
                    style={{
                      marginTop: '8px',
                      backgroundColor: '#1976D2',
                      borderColor: '#1976D2',
                      borderRadius: '4px',
                    }}
                    onClick={() => handleGenerateTravelog(item)}
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
        open={inputModalOpen}
        onOk={handleConfirmAdd}
        onCancel={() => {
          setInputModalOpen(false);
          setClickPosition(null);
          setCheckinName('');
        }}
        okText="确认签到"
        cancelText="取消"
      >
        <Title level={5} style={{ marginBottom: '8px' }}>
          请输入签到点名称
        </Title>
        <Input
          placeholder="请输入签到点名称（最多20字）"
          maxLength={20}
          value={checkinName}
          onChange={(e) => setCheckinName(e.target.value)}
          showCount
          autoFocus
        />
      </Modal>

      <TravelogEditor
        open={editorModalOpen}
        checkin={selectedCheckin}
        onClose={() => {
          setEditorModalOpen(false);
          setSelectedCheckin(null);
        }}
      />
    </div>
  );
}
