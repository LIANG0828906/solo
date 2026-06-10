import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Station, Document, Horse, HorseSpeed, DocumentLevel } from '../types';
import axios from 'axios';
import { useGameStore } from '../store/useGameStore';

interface StationPanelProps {
  station: Station;
  isOpen: boolean;
  onClose: () => void;
}

const StationPanel: React.FC<StationPanelProps> = ({ station, isOpen, onClose }) => {
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [message, setMessage] = useState<string>('');
  const updateStation = useGameStore(state => state.updateStation);
  const updateDocument = useGameStore(state => state.updateDocument);
  const addInTransitDocument = useGameStore(state => state.addInTransitDocument);
  const stations = useGameStore(state => state.stations);

  const getHorseColor = (speed: HorseSpeed) => {
    switch (speed) {
      case HorseSpeed.THREE_HUNDRED: return '#8b2500';
      case HorseSpeed.FIVE_HUNDRED: return '#b85a0a';
      case HorseSpeed.EIGHT_HUNDRED: return '#e8e8e8';
    }
  };

  const getDocumentColor = (level: DocumentLevel) => {
    switch (level) {
      case DocumentLevel.EXPRESS: return '#cc0000';
      case DocumentLevel.URGENT: return '#ff8c00';
      case DocumentLevel.NORMAL: return '#006400';
    }
  };

  const handleFeedHorse = async (horse: Horse) => {
    try {
      const res = await axios.post('http://localhost:3001/api/feed', {
        stationId: station.id,
        horseId: horse.id
      });
      updateStation(res.data.station);
      setMessage(res.data.message);
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.error || '喂养失败');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleVerifySeal = async (doc: Document) => {
    try {
      const res = await axios.post('http://localhost:3001/api/verify-seal', {
        documentId: doc.id,
        stationId: station.id
      });
      updateDocument(res.data.document);
      setMessage(res.data.message);
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.error || '验封失败');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handlePurchaseForage = async () => {
    try {
      const res = await axios.post('http://localhost:3001/api/purchase-forage', {
        stationId: station.id
      });
      updateStation(res.data.station);
      setMessage(res.data.message);
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.error || '采购失败');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDispatch = async (doc: Document, horse: Horse, toStationId: string) => {
    try {
      const res = await axios.post('http://localhost:3001/api/dispatch', {
        documentId: doc.id,
        fromStationId: station.id,
        toStationId,
        horseId: horse.id
      });
      addInTransitDocument(res.data.inTransitDoc);
      updateStation({
        ...station,
        pendingDocuments: station.pendingDocuments.filter(d => d.id !== doc.id),
        horses: station.horses.filter(h => h.id !== horse.id)
      });
      setSelectedHorse(null);
      setSelectedDocument(null);
      setMessage(res.data.message);
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.error || '发驿失败');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const availableStations = stations.filter(s => s.id !== station.id);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="station-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute',
            top: '-200px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '320px',
            backgroundColor: '#f5deb3',
            border: '3px solid #5d3a1a',
            borderRadius: '8px',
            padding: '16px',
            fontFamily: 'serif',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 100
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: '#6b4e3a',
              color: '#cc0000',
              border: '2px solid #3a2010',
              padding: '4px 8px',
              cursor: 'pointer',
              fontFamily: 'serif'
            }}
          >
            关闭
          </button>

          <h3 style={{ margin: '0 0 12px 0', color: '#5d3a1a', fontSize: '18px' }}>
            {station.name}
          </h3>

          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                backgroundColor: '#fff8dc',
                border: '1px solid #daa520',
                padding: '8px',
                marginBottom: '12px',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#8b4513'
              }}
            >
              {message}
            </motion.div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>马匹: {station.horses.length}/{station.maxHorses}</span>
              <span>驿卒: {station.staff}人</span>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span>草料: {station.forage}/{station.maxForage}斤</span>
              <div style={{
                width: '100%',
                height: '12px',
                backgroundColor: '#8b4513',
                borderRadius: '6px',
                overflow: 'hidden',
                marginTop: '4px'
              }}>
                <div style={{
                  height: '100%',
                  background: `linear-gradient(to right, #d4a76a, #8b4513)`,
                  width: `${(station.forage / station.maxForage) * 100}%`,
                  transition: 'width 0.3s'
                }} />
              </div>
              <button
                onClick={handlePurchaseForage}
                style={{
                  marginTop: '8px',
                  backgroundColor: '#6b4e3a',
                  color: '#cc0000',
                  border: '2px solid #3a2010',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontFamily: 'serif',
                  fontSize: '14px'
                }}
              >
                采购草料(+200斤)
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#5d3a1a', fontSize: '16px' }}>马厩</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {station.horses.map(horse => (
                <motion.div
                  key={horse.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedHorse(horse)}
                  style={{
                    padding: '8px',
                    backgroundColor: selectedHorse?.id === horse.id ? '#deb887' : '#fff8dc',
                    border: `2px solid ${selectedHorse?.id === horse.id ? '#cc0000' : '#8b4513'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    minWidth: '80px'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: getHorseColor(horse.speed),
                    boxShadow: horse.speed === HorseSpeed.EIGHT_HUNDRED ? '2px 2px 4px rgba(0,0,0,0.3)' : 'none',
                    marginBottom: '4px'
                  }} />
                  <div style={{ fontSize: '12px' }}>{horse.name}</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>日行{horse.speed}里</div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#ccc',
                    borderRadius: '3px',
                    marginTop: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      background: `linear-gradient(to right, #228b22, #90ee90)`,
                      width: `${horse.stamina}%`,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <div style={{ fontSize: '10px', color: '#666' }}>体力: {horse.stamina}%</div>
                  {horse.isExhausted && (
                    <div style={{ fontSize: '10px', color: '#cc0000' }}>已力竭</div>
                  )}
                  {horse.isResting && (
                    <div style={{ fontSize: '10px', color: '#228b22' }}>休息中</div>
                  )}
                  {!horse.isResting && !horse.isExhausted && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFeedHorse(horse);
                      }}
                      style={{
                        marginTop: '4px',
                        backgroundColor: '#6b4e3a',
                        color: '#cc0000',
                        border: '1px solid #3a2010',
                        padding: '2px 6px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      喂养
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#5d3a1a', fontSize: '16px' }}>待发公文</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {station.pendingDocuments.length === 0 ? (
                <div style={{ fontSize: '14px', color: '#888', textAlign: 'center' }}>暂无公文</div>
              ) : (
                station.pendingDocuments.map(doc => (
                  <motion.div
                    key={doc.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedDocument(doc)}
                    style={{
                      padding: '8px',
                      backgroundColor: selectedDocument?.id === doc.id ? '#deb887' : '#fff8dc',
                      border: `2px solid ${selectedDocument?.id === doc.id ? '#cc0000' : getDocumentColor(doc.level)}`,
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '16px',
                        height: '24px',
                        backgroundColor: getDocumentColor(doc.level),
                        borderRadius: '2px'
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{doc.title}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {doc.fromStation} → {doc.toStation}
                        </div>
                        <div style={{ fontSize: '11px', color: '#888' }}>
                          已用 {doc.elapsedHours.toFixed(1)} 时辰
                        </div>
                      </div>
                      {!doc.sealVerified ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerifySeal(doc);
                          }}
                          style={{
                            backgroundColor: '#cc0000',
                            color: '#fff',
                            border: 'none',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            borderRadius: '4px'
                          }}
                        >
                          验封
                        </button>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#228b22' }}>✓ 已验封</div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {selectedDocument && selectedHorse && selectedDocument.sealVerified && (
            <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fff8dc', borderRadius: '6px', border: '1px solid #daa520' }}>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                发遣: {selectedDocument.title}
              </div>
              <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                马匹: {selectedHorse.name}
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {availableStations.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleDispatch(selectedDocument, selectedHorse, s.id)}
                    style={{
                      backgroundColor: '#6b4e3a',
                      color: '#cc0000',
                      border: '2px solid #3a2010',
                      padding: '6px 10px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontFamily: 'serif'
                    }}
                  >
                    发往{s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StationPanel;
