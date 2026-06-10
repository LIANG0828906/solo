import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from './store/useGameStore';
import StationPanel from './components/StationPanel';
import DocumentFlow from './components/DocumentFlow';
import { Station } from './types';
import axios from 'axios';

const App: React.FC = () => {
  const {
    stations,
    inTransitDocuments,
    score,
    salary,
    currentTime,
    fetchInitialData,
    removeInTransitDocument,
    updateStation,
    addScore,
    addSalary,
    deductSalary,
    setCurrentTime
  } = useGameStore();

  const [openStationId, setOpenStationId] = useState<string | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [scrollStartX, setScrollStartX] = useState(0);
  const [arrivalNotification, setArrivalNotification] = useState<{
    show: boolean;
    message: string;
    documentTitle: string;
    stationName: string;
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const mapWidth = 1200;

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [setCurrentTime]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const shiChen = Math.floor(hours / 2);
    const shiChenNames = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    return `${shiChenNames[shiChen]}时 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleDocumentArrive = useCallback(async (documentId: string, toStationId: string) => {
    try {
      const res = await axios.get('http://localhost:3001/api/state');
      const state = res.data;
      
      const arrivedDoc = state.documents.find((d: any) => d.id === documentId);
      const station = state.stations.find((s: any) => s.id === toStationId);
      
      if (arrivedDoc && station) {
        if (arrivedDoc.status === 'delivered') {
          addScore(arrivedDoc.level === 'express' ? 30 : arrivedDoc.level === 'urgent' ? 20 : 10);
          addSalary(5);
        }
        
        state.inTransitDocuments.forEach((doc: any) => {
          if (doc.horse.isExhausted) {
            deductSalary(10);
          }
        });

        setArrivalNotification({
          show: true,
          message: arrivedDoc.status === 'delivered' 
            ? `公文已送达目的地！`
            : `公文已到达${station.name}`,
          documentTitle: arrivedDoc.title,
          stationName: station.name
        });

        setTimeout(() => setArrivalNotification(null), 3000);
      }

      removeInTransitDocument(documentId);
      
      state.stations.forEach((s: Station) => {
        updateStation(s);
      });
    } catch (error) {
      console.error('处理公文到达失败:', error);
      removeInTransitDocument(documentId);
    }
  }, [removeInTransitDocument, updateStation, addScore, addSalary, deductSalary]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setScrollStartX(scrollOffset);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - dragStartX;
    const maxScroll = mapWidth - window.innerWidth + 100;
    const newOffset = Math.max(0, Math.min(maxScroll, scrollStartX - diff));
    setScrollOffset(newOffset);
  }, [isDragging, dragStartX, scrollStartX, mapWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mouseleave', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const renderStation = (station: Station) => {
    const forageLow = station.forage / station.maxForage < 0.3;

    return (
      <motion.div
        key={station.id}
        className="station"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'absolute',
          left: `${station.position}px`,
          top: '280px',
          transform: 'translateX(-50%)',
          cursor: 'pointer'
        }}
        onClick={() => setOpenStationId(openStationId === station.id ? null : station.id)}
      >
        <div style={{ position: 'relative' }}>
          {forageLow && (
            <>
              <motion.div
                animate={{
                  y: [-20, -60],
                  opacity: [0.8, 0],
                  scale: [1, 1.5]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '30px',
                  width: '15px',
                  height: '15px',
                  backgroundColor: 'rgba(128, 128, 128, 0.6)',
                  borderRadius: '50%',
                  filter: 'blur(4px)'
                }}
              />
              <motion.div
                animate={{
                  y: [-20, -60],
                  opacity: [0.8, 0],
                  scale: [1, 1.5]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '50px',
                  width: '12px',
                  height: '12px',
                  backgroundColor: 'rgba(128, 128, 128, 0.6)',
                  borderRadius: '50%',
                  filter: 'blur(3px)'
                }}
              />
              <motion.div
                animate={{
                  y: [-20, -60],
                  opacity: [0.8, 0],
                  scale: [1, 1.5]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '70px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'rgba(128, 128, 128, 0.6)',
                  borderRadius: '50%',
                  filter: 'blur(3px)'
                }}
              />
            </>
          )}

          <div style={{
            width: '100px',
            height: '80px',
            backgroundColor: '#6b7b6b',
            border: '3px solid #4a5a4a',
            borderRadius: '4px',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              width: '35px',
              height: '50px',
              backgroundColor: '#8b5e3c',
              border: '2px solid #5d3a1a'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '-5px',
                width: '45px',
                height: '15px',
                backgroundColor: '#5a5a5a',
                clipPath: 'polygon(0 100%, 50% 0, 100% 100%)'
              }} />
            </div>

            <div style={{
              position: 'absolute',
              top: '15px',
              right: '10px',
              width: '30px',
              height: '45px',
              backgroundColor: '#d4a76a',
              border: '2px solid #8b4513',
              borderRadius: '2px'
            }}>
              <div style={{
                position: 'absolute',
                top: '-10px',
                left: '-5px',
                width: '40px',
                height: '15px',
                backgroundColor: '#d4a76a',
                borderRadius: '50% 50% 0 0'
              }} />
            </div>

            <div style={{
              position: 'absolute',
              bottom: '5px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '15px'
            }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  width: '6px',
                  height: '30px',
                  backgroundColor: '#cc0000',
                  border: '1px solid #8b0000',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '-6px',
                    width: '18px',
                    height: '10px',
                    backgroundColor: '#8b4513',
                    borderRadius: '2px'
                  }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: '8px',
            fontFamily: 'serif',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#5d3a1a',
            backgroundColor: '#f5deb3',
            padding: '4px 12px',
            border: '2px solid #8b4513',
            borderRadius: '4px'
          }}>
            {station.name}
          </div>

          {station.pendingDocuments.length > 0 && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '24px',
                height: '24px',
                backgroundColor: '#cc0000',
                color: '#fff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                border: '2px solid #fff'
              }}
            >
              {station.pendingDocuments.length}
            </motion.div>
          )}
        </div>

        <StationPanel
          station={station}
          isOpen={openStationId === station.id}
          onClose={() => setOpenStationId(null)}
        />
      </motion.div>
    );
  };

  const renderRoad = () => {
    const sortedStations = [...stations].sort((a, b) => a.position - b.position);
    if (sortedStations.length < 2) return null;

    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      >
        {sortedStations.slice(0, -1).map((station, index) => {
          const nextStation = sortedStations[index + 1];
          return (
            <g key={`road-${station.id}-${nextStation.id}`}>
              <line
                x1={station.position}
                y1="320"
                x2={nextStation.position}
                y2="320"
                stroke="#8b7355"
                strokeWidth="20"
                strokeLinecap="round"
              />
              <line
                x1={station.position}
                y1="320"
                x2={nextStation.position}
                y2="320"
                stroke="#a08060"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="5,15"
              />
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="app-container" style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#e8dcc3',
      position: 'relative'
    }}>
      <motion.div
        className="status-bar"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: 'rgba(93, 58, 26, 0.95)',
          borderBottom: '3px solid #3a2010',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 30px',
          zIndex: 1000,
          fontFamily: 'serif'
        }}
      >
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#f5deb3'
            }}
          >
            <span style={{ fontSize: '20px' }}>🏆</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>积分:</span>
            <motion.span
              key={score}
              initial={{ scale: 1.2, color: '#ffd700' }}
              animate={{ scale: 1, color: '#ffd700' }}
              transition={{ duration: 0.3 }}
              style={{ fontSize: '20px', fontWeight: 'bold', minWidth: '50px' }}
            >
              {score}
            </motion.span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#f5deb3'
            }}
          >
            <span style={{ fontSize: '20px' }}>💰</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>俸禄:</span>
            <motion.span
              key={salary}
              initial={{ scale: 1.2, color: '#90ee90' }}
              animate={{ scale: 1, color: '#90ee90' }}
              transition={{ duration: 0.3 }}
              style={{ fontSize: '20px', fontWeight: 'bold', minWidth: '50px' }}
            >
              {salary}
            </motion.span>
          </motion.div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#f5deb3'
        }}>
          <span style={{ fontSize: '20px' }}>🕐</span>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>当前时间:</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffd700' }}>
            {formatTime(currentTime)}
          </span>
        </div>
      </motion.div>

      <AnimatePresence>
        {arrivalNotification && arrivalNotification.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'fixed',
              top: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2000,
              padding: '20px 40px',
              backgroundColor: '#fff8dc',
              border: '4px solid #cc0000',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
            }}
          >
            <div style={{
              textAlign: 'center',
              fontFamily: 'serif'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#cc0000',
                marginBottom: '8px'
              }}>
                📜 公文到达
              </div>
              <div style={{
                fontSize: '18px',
                color: '#5d3a1a',
                marginBottom: '4px'
              }}>
                【{arrivalNotification.documentTitle}】
              </div>
              <div style={{
                fontSize: '16px',
                color: '#8b4513'
              }}>
                {arrivalNotification.message}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={scrollContainerRef}
        className="scroll-container"
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          top: '60px',
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        <motion.div
          className="map-container"
          animate={{ x: -scrollOffset }}
          transition={{ type: 'tween', ease: 'linear', duration: 0 }}
          style={{
            width: `${mapWidth}px`,
            height: '100%',
            position: 'relative',
            backgroundImage: `
              linear-gradient(180deg, 
                rgba(232, 220, 195, 0.9) 0%, 
                rgba(232, 220, 195, 1) 50%,
                rgba(210, 180, 140, 0.3) 100%
              )
            `,
            backgroundSize: '100% 100%'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '250px',
            background: 'linear-gradient(180deg, rgba(135, 206, 235, 0.3) 0%, transparent 100%)'
          }} />

          {[80, 250, 500, 750, 950].map((x, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: `${100 + (i % 3) * 30}px`,
              left: `${x}px`,
              width: `${60 + i * 20}px`,
              height: '30px',
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '50%',
              filter: 'blur(8px)'
            }} />
          ))}

          {renderRoad()}

          {stations.map(station => renderStation(station))}

          <DocumentFlow
            inTransitDocs={inTransitDocuments}
            onDocumentArrive={handleDocumentArrive}
          />

          <div style={{
            position: 'absolute',
            top: '200px',
            left: '50px',
            width: '80px',
            height: '100px',
            background: 'linear-gradient(180deg, #228b22 0%, #006400 100%)',
            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            opacity: 0.6
          }} />
          <div style={{
            position: 'absolute',
            top: '180px',
            left: '900px',
            width: '100px',
            height: '120px',
            background: 'linear-gradient(180deg, #228b22 0%, #006400 100%)',
            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
            opacity: 0.6
          }} />
        </motion.div>

        {mapWidth > window.innerWidth && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            fontFamily: 'serif',
            color: '#5d3a1a',
            fontSize: '14px',
            backgroundColor: 'rgba(255, 248, 220, 0.8)',
            padding: '8px 16px',
            borderRadius: '20px',
            border: '1px solid #8b4513'
          }}>
            <span>←</span>
            <span>拖动卷轴查看全景</span>
            <span>→</span>
          </div>
        )}
      </div>

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '30px',
        height: '100%',
        background: 'linear-gradient(90deg, #5d3a1a 0%, #8b4513 50%, #5d3a1a 100%)',
        zIndex: 100,
        boxShadow: '4px 0 8px rgba(0,0,0,0.3)'
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '30px',
        height: '100%',
        background: 'linear-gradient(270deg, #5d3a1a 0%, #8b4513 50%, #5d3a1a 100%)',
        zIndex: 100,
        boxShadow: '-4px 0 8px rgba(0,0,0,0.3)'
      }} />
    </div>
  );
};

export default App;
