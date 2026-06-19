import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import type { Device, DeviceType } from '../types';

const DeviceList = () => {
  const { devices, loading, filterType, setFilterType, setSelectedDevice, setCurrentView, reservations } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filterTypes: DeviceType[] = ['全部', '显微镜', '离心机', '光谱仪'];

  const filteredDevices =
    filterType === '全部'
      ? devices
      : devices.filter((device) => device.type === filterType);

  const getAvailableCount = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return 0;
    const today = new Date().toISOString().split('T')[0];
    const activeReservations = reservations.filter(
      (r) => r.deviceId === deviceId && r.endDate >= today && !r.isOverdue
    );
    return Math.max(0, device.stock - activeReservations.length);
  };

  const handleReserve = (device: Device) => {
    setSelectedDevice(device);
    setCurrentView('reservations');
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ color: '#0B3C5D', fontSize: '1.75rem' }}>设备列表</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {filterTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: filterType === type ? '#0B3C5D' : 'white',
                color: filterType === type ? 'white' : '#0B3C5D',
                border: '2px solid #0B3C5D',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (filterType !== type) {
                  e.currentTarget.style.backgroundColor = '#1A5A8C';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (filterType !== type) {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = '#0B3C5D';
                }
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            fontSize: '1.25rem',
            color: '#666',
          }}
        >
          加载中...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <AnimatePresence>
            {filteredDevices.map((device, index) => {
              const availableCount = getAvailableCount(device.id);
              const isAvailable = availableCount > 0;
              const isExpanded = expandedId === device.id;

              return (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.3, delay: index * 0.2 }}
                  layout
                  onClick={() => setExpandedId(isExpanded ? null : device.id)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    border: `3px solid ${isAvailable ? '#2E7D32' : '#C62828'}`,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ color: '#0B3C5D', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                        {device.name}
                      </h3>
                      <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        型号: {device.model}
                      </p>
                      <p style={{ color: '#888', fontSize: '0.875rem' }}>
                        类型: {device.type}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p
                        style={{
                          color: isAvailable ? '#2E7D32' : '#C62828',
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                        }}
                      >
                        库存: {availableCount}/{device.stock}
                      </p>
                      <p
                        style={{
                          color: isAvailable ? '#2E7D32' : '#C62828',
                          fontSize: '0.875rem',
                        }}
                      >
                        {isAvailable ? '可借用' : '已全部借出'}
                      </p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                          <p style={{ color: '#555', marginBottom: '1rem', lineHeight: 1.6 }}>
                            {device.description}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReserve(device);
                            }}
                            disabled={!isAvailable}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              backgroundColor: isAvailable ? '#0B3C5D' : '#ccc',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: isAvailable ? 'pointer' : 'not-allowed',
                              fontSize: '1rem',
                              transition: 'background-color 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (isAvailable) {
                                e.currentTarget.style.backgroundColor = '#1A5A8C';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isAvailable) {
                                e.currentTarget.style.backgroundColor = '#0B3C5D';
                              }
                            }}
                          >
                            {isAvailable ? '立即预约' : '暂无库存'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default DeviceList;
