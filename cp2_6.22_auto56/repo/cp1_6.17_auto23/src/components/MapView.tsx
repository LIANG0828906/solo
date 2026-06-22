import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Button, Modal, Input, message } from 'antd';
import { useMapStore } from '../store/mapStore';
import { useTravelogStore } from '../store/travelogStore';
import type { Checkin } from '../types';

const { TextArea } = Input;

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function UserLocationMarker() {
  const { userPosition } = useMapStore();

  if (!userPosition) return null;

  const userIcon = L.divIcon({
    className: 'custom-div-icon',
    html: '<div class="user-marker"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return <Marker position={userPosition} icon={userIcon} />;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapView() {
  const { checkins, userPosition, zoom, addCheckin, deleteCheckin } = useMapStore();
  const { addTravelog } = useTravelogStore();
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [checkinName, setCheckinName] = useState('');
  const [pendingLatLng, setPendingLatLng] = useState<[number, number] | null>(null);
  const [travelogModalVisible, setTravelogModalVisible] = useState(false);
  const [selectedCheckins, setSelectedCheckins] = useState<Checkin[]>([]);
  const [travelogTitle, setTravelogTitle] = useState('');
  const [travelogContent, setTravelogContent] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPendingLatLng([lat, lng]);
    setCheckinName('');
    setCheckinModalVisible(true);
  }, []);

  const handleAddCheckin = async () => {
    if (!checkinName.trim() || !pendingLatLng) {
      messageApi.warning('请输入签到名称');
      return;
    }
    if (checkinName.length > 20) {
      messageApi.warning('签到名称最多20字');
      return;
    }
    await addCheckin({
      name: checkinName.trim(),
      lat: pendingLatLng[0],
      lng: pendingLatLng[1],
    });
    setCheckinModalVisible(false);
    setCheckinName('');
    setPendingLatLng(null);
    messageApi.success('签到成功！');
  };

  const handleDeleteCheckin = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个签到点吗？',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await deleteCheckin(id);
        messageApi.success('已删除');
      },
    });
  };

  const handleGenerateTravelog = (checkin: Checkin) => {
    setSelectedCheckins([checkin]);
    setTravelogTitle(`${checkin.name}游记`);
    setTravelogContent(`今天我来到了${checkin.name}，这里的风景真的很美...\n\n签到时间：${formatDateTime(checkin.createdAt)}`);
    setTravelogModalVisible(true);
  };

  const handleSaveTravelog = async () => {
    if (!travelogTitle.trim()) {
      messageApi.warning('请输入游记标题');
      return;
    }
    if (travelogTitle.length > 30) {
      messageApi.warning('游记标题最多30字');
      return;
    }
    if (!travelogContent.trim()) {
      messageApi.warning('请输入游记正文');
      return;
    }
    if (travelogContent.length > 500) {
      messageApi.warning('游记正文最多500字');
      return;
    }

    await addTravelog({
      title: travelogTitle.trim(),
      content: travelogContent.trim(),
      checkinIds: selectedCheckins.map((c) => c.id),
    });

    setTravelogModalVisible(false);
    setTravelogTitle('');
    setTravelogContent('');
    setSelectedCheckins([]);
    messageApi.success('游记保存成功！');
  };

  const handlePreview = () => {
    setPreviewVisible(true);
  };

  const sortedCheckins = [...checkins].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const waterDropIcon = (name: string) =>
    L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="water-drop-marker">
          <div class="water-drop"></div>
          <div class="marker-label">${name}</div>
        </div>
      `,
      iconSize: [40, 60],
      iconAnchor: [20, 60],
    });

  if (!userPosition) return null;

  return (
    <div className="map-page" style={{ paddingTop: 45 }}>
      {contextHolder}
      <div className="map-container">
        <MapContainer
          center={userPosition}
          zoom={zoom}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <UserLocationMarker />
          <MapClickHandler onMapClick={handleMapClick} />
          {checkins.map((checkin) => (
            <Marker
              key={checkin.id}
              position={[checkin.lat, checkin.lng]}
              icon={waterDropIcon(checkin.name)}
            >
              <Popup>
                <div className="popup-title">{checkin.name}</div>
                <div className="popup-time">{formatDateTime(checkin.createdAt)}</div>
                <button
                  className="popup-delete-btn"
                  onClick={() => handleDeleteCheckin(checkin.id)}
                >
                  删除
                </button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="sidebar">
        <div className="sidebar-header">我的签到点</div>
        <div className="sidebar-list">
          {sortedCheckins.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📍</div>
              <div>暂无签到点</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>点击地图添加签到</div>
            </div>
          ) : (
            sortedCheckins.map((checkin) => (
              <div key={checkin.id} className="checkin-item">
                <div className="checkin-item-name">{checkin.name}</div>
                <div className="checkin-item-time">{formatDateTime(checkin.createdAt)}</div>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleGenerateTravelog(checkin)}
                  style={{ width: '100%' }}
                >
                  生成游记
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        title="添加签到点"
        open={checkinModalVisible}
        onOk={handleAddCheckin}
        onCancel={() => setCheckinModalVisible(false)}
        okText="确认签到"
        cancelText="取消"
      >
        <Input
          placeholder="请输入签到名称（最多20字）"
          value={checkinName}
          onChange={(e) => setCheckinName(e.target.value)}
          maxLength={20}
          showCount
          autoFocus
        />
      </Modal>

      <Modal
        title="编辑游记"
        open={travelogModalVisible}
        onCancel={() => setTravelogModalVisible(false)}
        footer={[
          <Button key="preview" onClick={handlePreview}>
            预览
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveTravelog}>
            保存
          </Button>,
        ]}
        width={640}
        styles={{ body: { height: 480, overflowY: 'auto' } }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            游记标题
          </label>
          <Input
            placeholder="请输入游记标题（最多30字）"
            value={travelogTitle}
            onChange={(e) => setTravelogTitle(e.target.value)}
            maxLength={30}
            showCount
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            游记正文
          </label>
          <TextArea
            placeholder="请输入游记正文（最多500字）"
            value={travelogContent}
            onChange={(e) => setTravelogContent(e.target.value)}
            maxLength={500}
            showCount
            autoSize={{ minRows: 8, maxRows: 12 }}
          />
        </div>
      </Modal>

      <Modal
        title="游记预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={640}
      >
        {selectedCheckins[0] && (
          <>
            <img
              src={selectedCheckins[0].photo}
              alt="封面"
              style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }}
            />
            <h3 style={{ marginBottom: 8 }}>{travelogTitle}</h3>
            <p style={{ color: '#757575', fontSize: 12, marginBottom: 16 }}>
              {formatDateTime(new Date().toISOString())}
            </p>
            <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{travelogContent}</p>
          </>
        )}
      </Modal>
    </div>
  );
}

export default MapView;
