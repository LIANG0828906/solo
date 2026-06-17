import { useState, useMemo } from 'react';
import { Modal } from 'antd';
import { ArrowLeftOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '../store/mapStore';
import type { Travelog } from '../types';

interface TravelogDetailProps {
  travelog: Travelog;
  onBack: () => void;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function TravelogDetail({ travelog, onBack }: TravelogDetailProps) {
  const { checkins } = useMapStore();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [mapModalVisible, setMapModalVisible] = useState(false);

  const travelCheckins = useMemo(() => {
    return travelog.checkinIds
      .map((id) => checkins.find((c) => c.id === id))
      .filter(Boolean) as typeof checkins;
  }, [travelog.checkinIds, checkins]);

  const photos = useMemo(() => {
    return [travelog.coverPhoto, ...travelCheckins.map((c) => c.photo)].filter(
      (photo, index, arr) => arr.indexOf(photo) === index
    );
  }, [travelog.coverPhoto, travelCheckins]);

  const mapCenter = useMemo(() => {
    if (travelCheckins.length > 0) {
      return [travelCheckins[0].lat, travelCheckins[0].lng] as [number, number];
    }
    return [39.9042, 116.4074] as [number, number];
  }, [travelCheckins]);

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

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

  return (
    <div className="travelog-detail-page">
      <div className="travelog-detail-back" onClick={onBack}>
        <ArrowLeftOutlined style={{ color: '#1A237E', fontSize: 18 }} />
      </div>

      <img
        src={travelog.coverPhoto}
        alt={travelog.title}
        className="travelog-detail-cover"
      />

      <div className="travelog-detail-content">
        <h1 className="travelog-detail-title">{travelog.title}</h1>
        <div className="travelog-detail-date">
          发布于 {formatDateTime(travelog.createdAt)}
        </div>

        {photos.length > 1 && (
          <div className="photo-gallery">
            <button className="photo-gallery-arrow left" onClick={handlePrevPhoto}>
              <LeftOutlined />
            </button>
            <img
              src={photos[currentPhotoIndex]}
              alt={`photo-${currentPhotoIndex}`}
              className="photo-gallery-image"
            />
            <button className="photo-gallery-arrow right" onClick={handleNextPhoto}>
              <RightOutlined />
            </button>
            {photos.length > 1 && (
              <div className="photo-gallery-indicator">
                {currentPhotoIndex + 1} / {photos.length}
              </div>
            )}
          </div>
        )}

        <div className="travelog-detail-body">{travelog.content}</div>

        {travelCheckins.length > 0 && (
          <div>
            <h3 style={{ marginBottom: 12, color: '#212121' }}>签到点位置</h3>
            <div
              className="mini-map-wrapper"
              onClick={() => setMapModalVisible(true)}
            >
              <MapContainer
                center={mapCenter}
                zoom={12}
                scrollWheelZoom={false}
                dragging={false}
                zoomControl={false}
                className="mini-map"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {travelCheckins.map((checkin) => (
                  <Marker
                    key={checkin.id}
                    position={[checkin.lat, checkin.lng]}
                    icon={waterDropIcon(checkin.name)}
                  />
                ))}
              </MapContainer>
              <div className="mini-map-label">点击查看完整地图</div>
            </div>
          </div>
        )}
      </div>

      <Modal
        title="签到点地图"
        open={mapModalVisible}
        onCancel={() => setMapModalVisible(false)}
        footer={null}
        width={800}
        className="fullscreen-map-modal"
      >
        <MapContainer
          center={mapCenter}
          zoom={13}
          scrollWheelZoom={true}
          className="fullscreen-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {travelCheckins.map((checkin) => (
            <Marker
              key={checkin.id}
              position={[checkin.lat, checkin.lng]}
              icon={waterDropIcon(checkin.name)}
            />
          ))}
        </MapContainer>
      </Modal>
    </div>
  );
}

export default TravelogDetail;
