import React, { useState, useEffect } from 'react';
import { Button, Modal, Divider, Tag, Timeline } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  ArrowLeftOutlined,
  ExpandOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CameraOutlined,
  CalendarOutlined,
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
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setCurrentImageIndex(0);
    setFadeIn(false);
    const timer = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(timer);
  }, [travelog.id]);

  const images = travelog.images && travelog.images.length > 0
    ? travelog.images
    : [travelog.coverImage];

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
    <div style={{ ...styles.container, opacity: fadeIn ? 1 : 0, transition: 'opacity 0.3s ease' }}>
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
        <img
          src={images[currentImageIndex]}
          alt={travelog.title}
          style={styles.coverImage}
        />

        <div style={styles.coverOverlay}>
          {images.length > 1 && (
            <>
              <Button
                icon={<LeftOutlined />}
                shape="circle"
                onClick={handlePrevImage}
                style={styles.navButton}
                size="large"
              />
              <Button
                icon={<RightOutlined />}
                shape="circle"
                onClick={handleNextImage}
                style={{ ...styles.navButton, right: 16, left: 'auto' }}
                size="large"
              />
            </>
          )}

          {images.length > 1 && (
            <div style={styles.imageCounter}>
              <CameraOutlined style={{ marginRight: 6 }} />
              {currentImageIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div style={styles.thumbnailStrip}>
            {images.map((img, index) => (
              <div
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                style={{
                  ...styles.thumbnail,
                  border: index === currentImageIndex
                    ? '2px solid #1976D2'
                    : '2px solid transparent',
                  opacity: index === currentImageIndex ? 1 : 0.6,
                }}
              >
                <img src={img} alt={`缩略图 ${index + 1}`} style={styles.thumbnailImg} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.content}>
        <h1 style={styles.title}>{travelog.title}</h1>

        <div style={styles.meta}>
          <Tag icon={<CalendarOutlined />} color="blue" style={styles.metaTag}>
            {formatDateTime(travelog.createdAt)}
          </Tag>
          <Tag icon={<EnvironmentOutlined />} color="geekblue" style={styles.metaTag}>
            {travelog.checkins?.length || 0} 个签到点
          </Tag>
          <Tag icon={<CameraOutlined />} color="cyan" style={styles.metaTag}>
            {images.length} 张照片
          </Tag>
        </div>

        <Divider style={{ margin: '20px 0' }} />

        <div style={styles.articleSection}>
          <h2 style={styles.sectionTitle}>游记正文</h2>
          <div style={styles.articleContent}>
            {travelog.content.split('\n').map((paragraph, index) => (
              <p key={index} style={styles.paragraph}>
                {paragraph || '\u00A0'}
              </p>
            ))}
          </div>
        </div>

        {travelog.checkins && travelog.checkins.length > 0 && (
          <>
            <Divider style={{ margin: '32px 0' }} />

            <div style={styles.mapSection}>
              <div style={styles.mapSectionHeader}>
                <h2 style={styles.sectionTitle}>
                  <EnvironmentOutlined style={{ marginRight: 8, color: '#1976D2' }} />
                  签到位置
                </h2>
                <Button
                  type="link"
                  icon={<ExpandOutlined />}
                  onClick={() => setMapModalVisible(true)}
                  style={{ color: '#1976D2', padding: 0, height: 'auto' }}
                >
                  查看大图
                </Button>
              </div>

              <div
                className="mini-map-container"
                style={styles.miniMapContainer}
                onClick={() => setMapModalVisible(true)}
              >
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
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {travelog.checkins.map((checkin) => (
                    <Marker
                      key={checkin.id}
                      position={[checkin.lat, checkin.lng]}
                      icon={miniMapIcon}
                    />
                  ))}
                </MapContainer>
                <div className="map-overlay" style={styles.mapOverlay}>
                  <span style={styles.mapOverlayText}>
                    <ExpandOutlined style={{ marginRight: 4 }} />
                    点击查看完整地图
                  </span>
                </div>
              </div>
            </div>

            <Divider style={{ margin: '32px 0' }} />

            <div style={styles.timelineSection}>
              <h2 style={styles.sectionTitle}>
                <ClockCircleOutlined style={{ marginRight: 8, color: '#1976D2' }} />
                签到时间线
              </h2>
              <Timeline
                items={travelog.checkins.map((checkin, index) => ({
                  color: '#1976D2',
                  children: (
                    <div style={styles.timelineItem}>
                      <div style={styles.timelineItemHeader}>
                        <span style={styles.timelineItemIndex}>#{index + 1}</span>
                        <span style={styles.timelineItemName}>{checkin.name}</span>
                      </div>
                      <div style={styles.timelineItemMeta}>
                        <span style={styles.timelineItemTime}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {formatDateTime(checkin.createdAt)}
                        </span>
                        <span style={styles.timelineItemCoord}>
                          <EnvironmentOutlined style={{ marginRight: 4 }} />
                          {checkin.lat.toFixed(4)}, {checkin.lng.toFixed(4)}
                        </span>
                      </div>
                      {checkin.imageUrl && (
                        <img
                          src={checkin.imageUrl}
                          alt={checkin.name}
                          style={styles.timelineItemImage}
                        />
                      )}
                    </div>
                  ),
                }))}
              />
            </div>
          </>
        )}
      </div>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: '#1976D2' }} />
            <span>签到点地图</span>
          </div>
        }
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
              <Marker key={checkin.id} position={[checkin.lat, checkin.lng]}>
                <Popup>
                  <div style={{ textAlign: 'center', padding: '4px 0' }}>
                    <strong style={{ color: '#1A237E' }}>{checkin.name}</strong>
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
    background: '#000',
  },
  coverImage: {
    width: '100%',
    height: 300,
    objectFit: 'cover' as const,
  },
  coverOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
  },
  navButton: {
    position: 'absolute' as const,
    top: '50%',
    left: 16,
    transform: 'translateY(-50%)',
    zIndex: 2,
    background: 'rgba(255,255,255,0.9)',
    border: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  imageCounter: {
    position: 'absolute' as const,
    bottom: 60,
    right: 16,
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 13,
    backdropFilter: 'blur(4px)',
  },
  thumbnailStrip: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    gap: 4,
    padding: '8px 16px',
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)',
    overflowX: 'auto' as const,
  },
  thumbnail: {
    width: 48,
    height: 36,
    borderRadius: 4,
    overflow: 'hidden',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'opacity 0.2s ease, border-color 0.2s ease',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
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
    marginBottom: 16,
    lineHeight: 1.4,
  },
  meta: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  metaTag: {
    borderRadius: 4,
    padding: '2px 8px',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1A237E',
    margin: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center',
  },
  articleSection: {
    marginBottom: 8,
  },
  articleContent: {
    background: '#fafafa',
    padding: 24,
    borderRadius: 8,
    border: '1px solid #f0f0f0',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 1.8,
    color: '#333',
    marginBottom: 12,
  },
  mapSection: {
    marginTop: 8,
  },
  mapSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  miniMapContainer: {
    position: 'relative' as const,
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    cursor: 'pointer',
    border: '1px solid #e8e8e8',
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
  timelineSection: {
    marginTop: 8,
  },
  timelineItem: {
    paddingBottom: 8,
  },
  timelineItemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  timelineItemIndex: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: 600,
    background: '#E3F2FD',
    padding: '1px 6px',
    borderRadius: 4,
  },
  timelineItemName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#333',
  },
  timelineItemMeta: {
    display: 'flex',
    gap: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  timelineItemTime: {
    fontSize: 12,
    color: '#999',
  },
  timelineItemCoord: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  timelineItemImage: {
    width: 120,
    height: 80,
    objectFit: 'cover' as const,
    borderRadius: 6,
    marginTop: 4,
  },
};

export default TravelogDetail;
