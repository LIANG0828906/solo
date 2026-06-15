import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { InTransitDocument, DocumentLevel } from '../types';
import HorseAnimation from './HorseAnimation';
import axios from 'axios';
import { useGameStore } from '../store/useGameStore';

interface DocumentFlowProps {
  inTransitDocs: InTransitDocument[];
  onDocumentArrive: (documentId: string, toStationId: string) => void;
}

const DocumentFlow: React.FC<DocumentFlowProps> = ({ inTransitDocs, onDocumentArrive }) => {
  const animationFrameRef = useRef<number>();
  const updateInTransitProgress = useGameStore(state => state.updateInTransitProgress);
  const stations = useGameStore(state => state.stations);

  const getDocumentColor = (level: DocumentLevel) => {
    switch (level) {
      case DocumentLevel.EXPRESS: return '#cc0000';
      case DocumentLevel.URGENT: return '#ff8c00';
      case DocumentLevel.NORMAL: return '#006400';
    }
  };

  useEffect(() => {
    if (inTransitDocs.length === 0) return;

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      inTransitDocs.forEach(doc => {
        const distance = Math.abs(doc.toPosition - doc.fromPosition);
        const speed = doc.horse.speed;
        const pixelsPerHour = distance / 12;
        const pixelsPerMs = pixelsPerHour / 3600000;
        const progressIncrement = (pixelsPerMs * deltaTime) / distance;

        const newProgress = Math.min(1, doc.progress + progressIncrement * 100);

        updateInTransitProgress(doc.document.id, newProgress);

        if (newProgress >= 1) {
          const toStation = stations.find(s => s.position === doc.toPosition);
          if (toStation) {
            const staminaUsed = Math.max(0, doc.horse.stamina - 30);
            const distanceRun = Math.abs(doc.toPosition - doc.fromPosition);
            
            axios.post('http://localhost:3001/api/arrive-station', {
              documentId: doc.document.id,
              horseId: doc.horse.id,
              toStationId: toStation.id,
              staminaUsed,
              distanceRun
            }).then(() => {
              onDocumentArrive(doc.document.id, toStation.id);
            }).catch(err => {
              console.error('到达驿站失败:', err);
            });
          }
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [inTransitDocs, updateInTransitProgress, stations, onDocumentArrive]);

  return (
    <>
      {inTransitDocs.map(doc => {
        const currentPosition = doc.fromPosition + (doc.toPosition - doc.fromPosition) * (doc.progress / 100);
        const docColor = getDocumentColor(doc.document.level);
        const remainingDistance = Math.abs(doc.toPosition - doc.fromPosition) * (1 - doc.progress / 100);
        const elapsedHours = ((Date.now() - doc.startTime) / 3600000);

        return (
          <motion.div
            key={doc.document.id}
            className="in-transit-document"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              left: `${currentPosition}px`,
              top: '260px'
            }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              zIndex: 50,
              cursor: 'pointer'
            }}
          >
            <div style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <HorseAnimation 
                horse={doc.horse} 
                isRunning={true}
                style={{ transform: doc.toPosition > doc.fromPosition ? 'scaleX(1)' : 'scaleX(-1)' }}
              />
              <motion.div
                animate={{
                  boxShadow: ['0 0 0px rgba(204, 0, 0, 0)', '0 0 10px rgba(204, 0, 0, 0.5)', '0 0 0px rgba(204, 0, 0, 0)']
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: '18px',
                  height: '28px',
                  backgroundColor: docColor,
                  borderRadius: '3px',
                  marginTop: '-5px',
                  position: 'relative',
                  border: '2px solid #5d3a1a'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#d4a76a',
                  borderRadius: '50%',
                  border: '1px solid #8b4513'
                }} />
              </motion.div>
              <div style={{
                fontSize: '10px',
                color: '#5d3a1a',
                backgroundColor: 'rgba(255, 248, 220, 0.9)',
                padding: '2px 6px',
                borderRadius: '4px',
                marginTop: '4px',
                whiteSpace: 'nowrap',
                fontFamily: 'serif'
              }}>
                <div>{doc.document.title}</div>
                <div>已用 {elapsedHours.toFixed(1)} 时辰</div>
                <div>剩余 {remainingDistance.toFixed(0)} 里</div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </>
  );
};

export default DocumentFlow;
