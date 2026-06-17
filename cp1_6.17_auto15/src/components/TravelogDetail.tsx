import React, { useState, useEffect } from 'react';
import { Button, Modal } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  ArrowLeftOutlined,
  ExpandOutlined,
} from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { Travelog } from '../types';
import { formatDateTime } from '../utils/format';
import L from 'leaflet';

const miniMapIcon = L.divIcon({
  className: 'mini-map-marker',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #1976D2;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 20],
});

interface TravelogDetailProps {
  travelog: Travelog;
  onBack: () => void;
}

const TravelogDetail: React.FC<TravelogDetailProps> = ({ travelog, onBack }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    setCurrentImageIndex(0);
    setImagesLoaded(false);
    const timer = setTimeout(() => setImagesLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [travelog.id]);

  const images = travelog.images || [travelog.coverImage];

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const mapCenter: [number, number] =
    travelog.checkins && travelog.checkins.length > 0
      ? [travelog.checkins[0].lat, travelog.checkins[0].lng]
      : [39.9042, 116.4074];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          style={styles.backButton}
        >
          返回列表
        </Button>
      </div>

      <div style={styles.coverContainer}>
        {images.length > 1 && (
          <Button
            icon={<LeftOutlined />}
            shape="circle"
            onClick={handlePrevImage}
            style={styles.imageNavButtonLeft}
          />
        )}

        <img
          src={images[currentImageIndex]}
          alt={travelog.title}
          style={{
            ...styles.coverImage,
            opacity: imagesLoaded ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        />

        {images.length > 1 && (
          <Button
            icon={<RightOutlined />}
            shape="circle"
            onClick={handleNextImage}
            style={styles.imageNavButtonRight}
          />
        )}

        {images.length > 1 && (
          <div style={styles.imageIndicator}>
            {images.map((_, index) => (
              <span
                key={index}
                style={{
                  ...styles.indicatorDot,
                  background: index === currentImageIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div style={styles.content}>
        <h1 style={styles.title}>{travelog.title}</h1>
        <div style={styles.meta}>
          <span style={styles.metaItem}>
            {formatDateTime(travelog.createdAt)}
          </span>
          <span style={styles.metaDivider}>·</span>
          <span style={styles.metaItem}>
            {travelog.checkins?.length || 0} 个签到点
          </span>
        </div>

        <div style={styles.articleContent}>
          {travelog.content.split('\n').map((paragraph, index) => (
            <p key={index} style={styles.paragraph}>
              {paragraph}
            </p>
          ))}
        </div>

        {travelog.checkins && travelog.checkins.length > 0 && (
          <div style={styles.mapSection}>
            <div style={styles.mapSectionHeader}>
              <h3 style={styles.mapSectionTitle}>签到位置</h3>
              <Button
                type="text"
                icon={<ExpandOutlined />}
                onClick={() => setMapModalVisible(true)}
                style={styles.expandButton}
              >
                查看大图
              </Button>
            </div>

            <div className="mini-map-container" style={styles.miniMapContainer} onClick={() => setMapModalVisible(true)}>
              <MapContainer
                center={mapCenter}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                boxZoom={false}
                keyboard={false}
                attributionControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {travelog.checkins.map((checkin) => (
                  <Marker
                    key={checkin.id}
                    position={[checkin.lat, checkin.lng]}
                    icon={miniMapIcon}
                  />
                ))}
              </MapContainer>
              <div className="map-overlay" style={styles.mapOverlay}>
                <span style={styles.mapOverlayText}>点击查看完整地图</span>
              </div>
            </div>

            <div style={styles.checkinsList}>
              {travelog.checkins.map((checkin, index) => (
                <div key={checkin.id} style={styles.checkinItem}>
                  <div style={styles.checkinIndex}>{index + 1}</div>
                  <div style={styles.checkinInfo}>
                    <span style={styles.checkinName}>{checkin.name}</span>
                    <span style={styles.checkinTime}>
                      {formatDateTime(checkin.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        title="签到点地图"
        open={mapModalVisible}
        onCancel={() => setMapModalVisible(false)}
        footer={null}
        width={900}
        centered
      >
        <div style={{ height: 500 }}>
          <MapContainer
            center={mapCenter}
            zoom={12}
            style={{ height: '100%', width: '100%', borderRadius: 8 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {travelog.checkins?.map((checkin) => (
              <Marker
                key={checkin.id}
                position={[checkin.lat, checkin.lng]}
              >
                <Popup>
                  <div style={{ textAlign: 'center' }}>
                    <strong>{checkin.name}</strong>
                    <br />
                    <span style={{ fontSize: 12, color: '#999' }}>
                      {formatDateTime(checkin.createdAt)}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </Modal>
    </div>
  );
};

const styles = {
  container: {
    height: '100%',
    overflowY: 'auto' as const,
    background: '#fff',
  },
  header: {
    padding: '16px 24px',
    borderBottom: '1px solid #f0f0f0',
    background: '#fff',
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
  },
  backButton: {
    color: '#1A237E',
    borderColor: '#1A237E',
  },
  coverContainer: {
    position: 'relative' as const,
    width: '100%',
    height: 300,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  imageNavButtonLeft: {
    position: 'absolute' as const,
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 2,
    background: 'rgba(255,255,255,0.9)',
    border: 'none',
  },
  imageNavButtonRight: {
    position: 'absolute' as const,
    right: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 2,
    background: 'rgba(255,255,255,0.9)',
    border: 'none',
  },
  imageIndicator: {
    position: 'absolute' as const,
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 8,
    zIndex: 2,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    transition: 'background 0.3s ease',
  },
  content: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '32px 24px',
  },
  title: {
    fontSize: 28,
    fontWeight: 600,
    color: '#1A237E',
    marginBottom: 12,
    lineHeight: 1.4,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '1px solid #f0f0f0',
  },
  metaItem: {
    fontSize: 14,
    color: '#999',
  },
  metaDivider: {
    margin: '0 8px',
    color: '#ddd',
  },
  articleContent: {
    marginBottom: 32,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 1.8,
    color: '#333',
    marginBottom: 16,
  },
  mapSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTop: '1px solid #f0f0f0',
  },
  mapSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mapSectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1A237E',
    margin: 0,
  },
  expandButton: {
    color: '#1976D2',
    padding: 0,
    height: 'auto',
  },
  miniMapContainer: {
    position: 'relative' as const,
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    cursor: 'pointer',
  },
  mapOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: '12px 16px',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  mapOverlayText: {
    color: '#fff',
    fontSize: 13,
  },
  checkinsList: {
    marginTop: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  checkinItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    background: '#f5f5f5',
    borderRadius: 8,
  },
  checkinIndex: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: '#1976D2',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkinInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  checkinName: {
    fontSize: 14,
    fontWeight: 500,
    color: '#333',
  },
  checkinTime: {
    fontSize: 12,
    color: '#999',
  },
};

export default TravelogDetail;
