import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { generateTemperatureGradient } from '@/utils/temperatureCalculator';
import { GAS_COLORS } from '@/types';

const ResultPanel = () => {
  const { currentYear, temperatureData, emissionSources, selectedSourceId } = useAppStore();
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const currentTempData = temperatureData[currentYear];
  const gradientColors = useMemo(() => generateTemperatureGradient(20), []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const sortedSources = useMemo(() => {
    if (!currentTempData) return [];
    return [...currentTempData.sourceContributions]
      .sort((a, b) => b.contribution - a.contribution)
      .map((item, index) => {
        const source = emissionSources.find(s => s.id === item.sourceId);
        return {
          ...item,
          name: source?.name || '未知',
          gasType: source?.gasType || 'CO2',
          rank: index + 1,
        };
      });
  }, [currentTempData, emissionSources, lastUpdate]);

  const maxTemp = 4.5;
  const currentTemp = currentTempData?.increment || 0;
  const tempPercent = Math.min(currentTemp / maxTemp, 1);

  const getCurrentColor = (percent: number) => {
    const index = Math.min(Math.floor(percent * gradientColors.length), gradientColors.length - 1);
    return gradientColors[index];
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}>
        <h3 style={{
          color: '#A8D0E6',
          fontSize: '14px',
          fontWeight: 500,
          margin: 0,
        }}>
          全球平均温度增量
        </h3>
        
        <motion.div
          key={`${currentYear}-${currentTemp}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '4px',
          }}
        >
          <span style={{
            fontFamily: 'monospace',
            fontSize: '48px',
            fontWeight: 700,
            color: getCurrentColor(tempPercent),
            textShadow: `0 0 20px ${getCurrentColor(tempPercent)}40`,
          }}>
            {currentTemp.toFixed(2)}
          </span>
          <span style={{
            fontSize: '20px',
            color: '#A8D0E6',
            fontWeight: 500,
          }}>
            ℃
          </span>
        </motion.div>
        
        <div style={{
          fontSize: '12px',
          color: '#7F8C8D',
        }}>
          相对于工业革命前
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '20px',
        alignItems: 'flex-start',
      }}>
        <div style={{
          position: 'relative',
          width: 30,
          height: 400,
          borderRadius: 15,
          overflow: 'hidden',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `linear-gradient(to top, ${gradientColors.join(', ')})`,
          }} />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTemp}
              initial={{ y: 400 }}
              animate={{ y: 400 - tempPercent * 400 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'white',
                boxShadow: '0 0 10px rgba(255,255,255,0.8), 0 2px 6px rgba(0,0,0,0.3)',
                zIndex: 2,
              }}
            />
          </AnimatePresence>

          <div style={{
            position: 'absolute',
            right: '35px',
            top: 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#7F8C8D',
            fontFamily: 'monospace',
          }}>
            <span>+{maxTemp.toFixed(1)}℃</span>
            <span>+{(maxTemp / 2).toFixed(1)}℃</span>
            <span>+0.0℃</span>
          </div>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <h4 style={{
            color: '#A8D0E6',
            fontSize: '13px',
            fontWeight: 600,
            margin: 0,
            marginBottom: '4px',
          }}>
            排放源贡献排名
          </h4>
          
          <AnimatePresence>
            {sortedSources.slice(0, 5).map((source) => (
              <motion.div
                key={source.sourceId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  backgroundColor: selectedSourceId === source.sourceId 
                    ? 'rgba(46, 134, 193, 0.2)' 
                    : 'rgba(15, 27, 51, 0.5)',
                  borderRadius: '8px',
                  border: selectedSourceId === source.sourceId 
                    ? '1px solid #2E86C1' 
                    : '1px solid transparent',
                  transition: 'all 0.3s ease',
                }}
              >
                <span style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  backgroundColor: GAS_COLORS[source.gasType],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'white',
                  flexShrink: 0,
                }}>
                  {source.rank}
                </span>
                
                <span style={{
                  flex: 1,
                  fontSize: '12px',
                  color: 'white',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {source.name}
                </span>
                
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#A8D0E6',
                  fontWeight: 600,
                }}>
                  {(source.contribution * 100).toFixed(1)}%
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div style={{
        marginTop: 'auto',
        padding: '12px',
        backgroundColor: 'rgba(15, 27, 51, 0.5)',
        borderRadius: '8px',
        border: '1px solid #2C3E50',
      }}>
        <div style={{
          fontSize: '11px',
          color: '#7F8C8D',
          marginBottom: '4px',
        }}>
          💡 提示
        </div>
        <div style={{
          fontSize: '11px',
          color: '#A8D0E6',
          lineHeight: 1.5,
        }}>
          {selectedSourceId 
            ? '当前显示选中排放源的热力分布。点击其他气泡切换，再次点击取消选择。'
            : '点击左侧气泡选择排放源，查看其对全球升温的具体贡献分布。'}
        </div>
      </div>
    </div>
  );
};

export default ResultPanel;
