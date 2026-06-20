import { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { Button, Typography, Modal, Carousel, Empty } from 'antd';
import {
  ArrowLeftOutlined,
  LeftOutlined,
  RightOutlined,
  ExpandOutlined,
} from '@ant-design/icons';
import { useMapStore } from '@/store/mapStore';
import { formatDateTime } from '@/utils/format';
import type { Travelog } from '@/types';

const { Title, Paragraph } = Typography;

const miniIcon = new DivIcon({
  className: 'mini-marker',
  html: `<div style="
    width: 20px;
    height: 20px;
    background: #1976D2;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 20],
});

interface TravelogDetailProps {
  travelog: Travelog;
  onBack: () => void;
}

export default function TravelogDetail({ travelog, onBack }: TravelogDetailProps) {
  const { checkins, fetchCheckins } = useMapStore();
  const [fullscreenMap, setFullscreenMap] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  const relatedCheckins = checkins.filter((c) =>
    travelog.checkinIds.includes(c.id)
  );

  const photos = travelog.photos.length > 0 ? travelog.photos : [];
  const centerCheckin = relatedCheckins[0];

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev <= 0 ? photos.length - 1 : prev - 1
    );
  };

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev >= photos.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="travelog-detail-container" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="travelog-detail-header" style={{ marginBottom: '0' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          style={{ marginBottom: '16px' }}
        >
          返回列表
        </Button>
      </div>

      <div className="travelog-cover">
        {travelog.coverPhotoUrl ? (
          <img src={travelog.coverPhotoUrl} alt={travelog.title} />
        ) : (
          <div className="travelog-cover-placeholder">
            <span style={{ fontSize: '64px' }}>🏞️</span>
          </div>
        )}
      </div>

      <div className="travelog-detail-content" style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        <Title level={2} style={{ color: '#1A237E', marginBottom: '8px' }}>
          {travelog.title}
        </Title>
        <div style={{ color: '#999', marginBottom: '24px', fontSize: '14px' }}>
          发布于 {formatDateTime(travelog.createdAt)}
        </div>

        {photos.length > 0 && (
          <div className="photo-gallery" style={{ position: 'relative', marginBottom: '24px' }}>
            <div className="photo-gallery-main" style={{
              width: '100%',
              height: '400px',
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {photos.length > 1 && (
                <>
                  <button
                    className="gallery-arrow left"
                    onClick={handlePrevPhoto}
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      color: '#333',
                      zIndex: 10,
                      transition: 'all 0.2s',
                    }}
                  >
                    <LeftOutlined />
                  </button>
                  <button
                    className="gallery-arrow right"
                    onClick={handleNextPhoto}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      color: '#333',
                      zIndex: 10,
                      transition: 'all 0.2s',
                    }}
                  >
                    <RightOutlined />
                  </button>
                </>
              )}
              <img
                src={photos[currentPhotoIndex]}
                alt={`photo-${currentPhotoIndex}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
            {photos.length > 1 && (
              <div className="photo-gallery-dots" style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '12px',
              }}>
                {photos.map((_, idx) => (
                  <button
                    key={idx}
                    className={`photo-dot ${idx === currentPhotoIndex ? 'active' : ''}`}
                    onClick={() => setCurrentPhotoIndex(idx)}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: idx === currentPhotoIndex ? '#1A237E' : '#ccc',
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <Paragraph className="travelog-detail-body" style={{
          fontSize: '16px',
          lineHeight: '2',
          color: '#333',
          whiteSpace: 'pre-wrap',
          marginBottom: '32px',
        }}>
          {travelog.content}
        </Paragraph>

        {relatedCheckins.length > 0 && (
          <div className="travelog-map-section">
            <Title level={4} style={{ marginBottom: '16px', color: '#1A237E' }}>
              签到地点
            </Title>
            <div
              className="mini-map-wrapper"
              style={{
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #e0e0e0',
              }}
              onClick={() => setFullscreenMap(true)}
            >
              {centerCheckin && (
                <MapContainer
                  center={[centerCheckin.lat, centerCheckin.lng]}
                  zoom={13}
                  style={{ height: '240px', width: '100%' }}
                  zoomControl={false}
                  dragging={false}
                  touchZoom={false}
                  doubleClickZoom={false}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {relatedCheckins.map((checkin) => (
                    <Marker
                      key={checkin.id}
                      position={[checkin.lat, checkin.lng]}
                      icon={miniIcon}
                    >
                      <Popup>{checkin.name}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
              <button
                className="expand-map-btn"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ExpandOutlined />
                展开全屏
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={fullscreenMap}
        onCancel={() => setFullscreenMap(false)}
        footer={null}
        width="90vw"
        centered
        closable
      >
        {centerCheckin && (
          <MapContainer
            center={[centerCheckin.lat, centerCheckin.lng]}
            zoom={14}
            style={{ height: '70vh', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {relatedCheckins.map((checkin) => (
              <Marker
                key={checkin.id}
                position={[checkin.lat, checkin.lng]}
                icon={miniIcon}
              >
                <Popup>
                  <strong>{checkin.name}</strong>
                  <br />
                  {formatDateTime(checkin.createdAt)}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </Modal>
    </div>
  );
}
