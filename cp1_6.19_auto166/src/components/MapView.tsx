import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, CityPoint, Reader, DriftLog } from '../types';

interface MapViewProps {
  books: Book[];
  cities: CityPoint[];
  readers: Reader[];
}

interface HoveredPoint {
  x: number;
  y: number;
  readerName: string;
  date: string;
  cityName: string;
}

export default function MapView({ books, cities, readers }: MapViewProps) {
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null);

  const driftPaths = useMemo(() => {
    return books
      .filter(book => book.driftLogs.length > 0)
      .map(book => {
        const sortedLogs = [...book.driftLogs].sort(
          (a, b) => new Date(a.borrowDate).getTime() - new Date(b.borrowDate).getTime()
        );
        const points = sortedLogs.map(log => ({
          x: log.location.x,
          y: log.location.y,
          readerId: log.readerId,
          borrowDate: log.borrowDate,
          cityName: log.cityName,
        }));
        
        if (book.driftLogs.length === 0 && book.startLocation) {
          points.unshift({
            x: book.startLocation.x,
            y: book.startLocation.y,
            readerId: '',
            borrowDate: book.createdAt,
            cityName: book.startCity,
          });
        }

        return {
          bookId: book.id,
          bookTitle: book.title,
          points,
          colorIndex: books.indexOf(book),
        };
      });
  }, [books]);

  const colorPalette = [
    '#2E7D32',
    '#D2691E',
    '#1565C0',
    '#6A1B9A',
    '#C62828',
    '#F57F17',
  ];

  const getGradientColors = (index: number) => {
    const base = colorPalette[index % colorPalette.length];
    return { start: base, end: '#FFB300' };
  };

  const getReaderById = (readerId: string) => {
    return readers.find(r => r.id === readerId);
  };

  const handlePointHover = (
    e: React.MouseEvent,
    log: DriftLog,
    reader: Reader | undefined
  ) => {
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const mapRect = (e.currentTarget.closest('svg') as SVGElement)?.getBoundingClientRect();
    
    if (mapRect) {
      setHoveredPoint({
        x: rect.left - mapRect.left + rect.width / 2,
        y: rect.top - mapRect.top,
        readerName: reader?.name || '未知',
        date: log.borrowDate,
        cityName: log.cityName,
      });
    }
  };

  const handlePointLeave = () => {
    setHoveredPoint(null);
  };

  const allDriftPoints = useMemo(() => {
    const points: {
      x: number;
      y: number;
      log: DriftLog;
      reader: Reader | undefined;
    }[] = [];
    
    books.forEach(book => {
      book.driftLogs.forEach(log => {
        const reader = getReaderById(log.readerId);
        points.push({
          x: log.location.x,
          y: log.location.y,
          log,
          reader,
        });
      });
    });
    
    return points;
  }, [books, readers]);

  return (
    <div style={{ position: 'relative' }}>
      <h3
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#3E2723',
          marginBottom: '10px',
        }}
      >
        🗺️ 阅读轨迹地图
      </h3>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          width: '100%',
          maxWidth: '600px',
          aspectRatio: '600/400',
          backgroundColor: '#FFF8E7',
          borderRadius: '12px',
          boxShadow: '0px 4px 12px rgba(62,39,35,0.15)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <svg
          viewBox="0 0 600 400"
          width="100%"
          height="100%"
          style={{ display: 'block' }}
        >
          <defs>
            {driftPaths.map((path, index) => {
              const colors = getGradientColors(index);
              return (
                <linearGradient
                  key={`gradient-${path.bookId}`}
                  id={`path-gradient-${path.bookId}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor={colors.start} />
                  <stop offset="100%" stopColor={colors.end} />
                </linearGradient>
              );
            })}
          </defs>

          {cities.map(city => (
            <circle
              key={city.id}
              cx={city.x}
              cy={city.y}
              r="4"
              fill="#4CAF50"
              opacity={0.6}
            />
          ))}

          {driftPaths.map((path, pathIndex) => {
            if (path.points.length < 2) return null;

            const pathD = path.points
              .map((point, i) => (i === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
              .join(' ');

            return (
              <g key={`path-${path.bookId}`}>
                <motion.path
                  d={pathD}
                  fill="none"
                  stroke={`url(#path-gradient-${path.bookId})`}
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 + pathIndex * 0.1 }}
                />
                
                {path.points.map((point, pointIndex) => {
                  const isLast = pointIndex === path.points.length - 1;
                  return (
                    <motion.circle
                      key={`point-${path.bookId}-${pointIndex}`}
                      cx={point.x}
                      cy={point.y}
                      r={isLast ? 5 : 3.5}
                      fill={isLast ? '#FFB300' : getGradientColors(pathIndex).start}
                      stroke="white"
                      strokeWidth="1.5"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        duration: 0.3,
                        delay: 0.5 + pathIndex * 0.1 + pointIndex * 0.05,
                        type: 'spring',
                        stiffness: 300,
                      }}
                    />
                  );
                })}
              </g>
            );
          })}

          {allDriftPoints.map((point, index) => (
            <circle
              key={`hover-point-${index}`}
              cx={point.x}
              cy={point.y}
              r="10"
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => handlePointHover(e, point.log, point.reader)}
              onMouseLeave={handlePointLeave}
            />
          ))}
        </svg>

        <AnimatePresence>
          {hoveredPoint && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                left: hoveredPoint.x,
                top: hoveredPoint.y - 8,
                transform: 'translate(-50%, -100%)',
                backgroundColor: '#FFD54F',
                color: '#3E2723',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 10,
                boxShadow: '0px 2px 6px rgba(0,0,0,0.15)',
              }}
            >
              <div style={{ fontWeight: 600 }}>{hoveredPoint.readerName}</div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>
                {hoveredPoint.cityName} · {hoveredPoint.date}
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: '-6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '6px solid #FFD54F',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginTop: '10px',
          flexWrap: 'wrap',
          fontSize: '12px',
          color: '#5D4037',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
            }}
          />
          <span>城市节点</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '20px',
              height: '2px',
              background: 'linear-gradient(to right, #2E7D32, #FFB300)',
              borderRadius: '1px',
            }}
          />
          <span>漂流行程</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#FFB300',
              border: '2px solid white',
              boxShadow: '0 0 0 1px #FFB300',
            }}
          />
          <span>当前位置</span>
        </div>
      </div>
    </div>
  );
}
