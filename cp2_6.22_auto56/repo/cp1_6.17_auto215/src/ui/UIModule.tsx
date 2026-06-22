import { useState, useEffect, useRef, useCallback } from 'react';
import { create } from 'zustand';
import { CityData, EventType, Continent, FilterConfig, TimeConfig, LayerConfig, ClimateRecord } from '../types/DataTypes';
import { eventBus } from '../event/EventBus';
import { dataLoader } from '../data/DataLoader';

const globalStyles = `
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }
  
  input[type="range"]::-webkit-slider-runnable-track {
    background: #2A2A3E;
    height: 6px;
    border-radius: 3px;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #BB86FC;
    cursor: pointer;
    margin-top: -7px;
    box-shadow: 0 2px 8px rgba(187, 134, 252, 0.5);
    transition: transform 200ms ease-out, box-shadow 200ms ease-out;
  }
  
  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 4px 12px rgba(187, 134, 252, 0.7);
  }
  
  input[type="range"]::-moz-range-track {
    background: #2A2A3E;
    height: 6px;
    border-radius: 3px;
  }
  
  input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #BB86FC;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba(187, 134, 252, 0.5);
    transition: transform 200ms ease-out;
  }
  
  input[type="range"]::-moz-range-thumb:hover {
    transform: scale(1.15);
  }

  * {
    scrollbar-width: thin;
    scrollbar-color: #2A2A3E transparent;
  }
  
  *::-webkit-scrollbar {
    width: 6px;
  }
  
  *::-webkit-scrollbar-track {
    background: transparent;
  }
  
  *::-webkit-scrollbar-thumb {
    background-color: #2A2A3E;
    border-radius: 3px;
  }
  
  *::-webkit-scrollbar-thumb:hover {
    background-color: #3A3A4E;
  }
`;

interface AppState {
  cities: CityData[];
  selectedCity: CityData | null;
  showInfoCard: boolean;
  infoCardPosition: { x: number; y: number };
  timeConfig: TimeConfig;
  filterConfig: FilterConfig;
  layerConfig: LayerConfig;
}

const useAppStore = create<AppState>((set) => ({
  cities: [],
  selectedCity: null,
  showInfoCard: false,
  infoCardPosition: { x: 0, y: 0 },
  timeConfig: {
    year: 2020,
    month: 0,
    isPlaying: false,
    playSpeed: 1
  },
  filterConfig: {
    continent: 'all',
    compareCities: []
  },
  layerConfig: {
    heatmap: false,
    windParticles: false
  }
}));

const continentLabels: Record<Continent, string> = {
  all: '全部',
  asia: '亚洲',
  europe: '欧洲',
  northAmerica: '北美洲',
  southAmerica: '南美洲',
  africa: '非洲',
  oceania: '大洋洲'
};

const getMonthIndex = (year: number, month: number) => (year - 2020) * 12 + month;

function InfoCard() {
  const { selectedCity, showInfoCard } = useAppStore();

  if (!showInfoCard || !selectedCity) return null;

  const record = selectedCity.monthlyData[0] || { aqi: 0, pm25: 0, temperature: 0, humidity: 0 };

  const getAqiLevel = (aqi: number) => {
    if (aqi <= 50) return { text: '优', color: '#00E676' };
    if (aqi <= 100) return { text: '良', color: '#FFEB3B' };
    if (aqi <= 150) return { text: '轻度污染', color: '#FF9800' };
    if (aqi <= 200) return { text: '中度污染', color: '#FF5722' };
    return { text: '重度污染', color: '#FF1744' };
  };

  const aqiLevel = getAqiLevel(record.aqi);

  return (
    <div style={styles.infoCard}>
      <div style={styles.infoCardHeader}>
        <h3 style={styles.cityName}>{selectedCity.name}</h3>
        <span style={{ ...styles.aqiBadge, backgroundColor: aqiLevel.color }}>{aqiLevel.text}</span>
      </div>
      <div style={styles.infoCardBody}>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>AQI</span>
          <span style={{ ...styles.infoValue, color: aqiLevel.color }}>{Math.round(record.aqi)}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>PM2.5</span>
          <span style={styles.infoValue}>{Math.round(record.pm25)} μg/m³</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>温度</span>
          <span style={styles.infoValue}>{record.temperature.toFixed(1)}°C</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>湿度</span>
          <span style={styles.infoValue}>{Math.round(record.humidity)}%</span>
        </div>
      </div>
    </div>
  );
}

function LeftSidebar() {
  const { filterConfig, cities } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const continents: Continent[] = ['all', 'asia', 'europe', 'northAmerica', 'southAmerica', 'africa', 'oceania'];

  const filteredCities = cities.filter(city => {
    const matchesContinent = filterConfig.continent === 'all' || city.continent === filterConfig.continent;
    const matchesSearch = city.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesContinent && matchesSearch;
  }).slice(0, 50);

  const handleContinentChange = (continent: Continent) => {
    const newConfig = { ...filterConfig, continent };
    useAppStore.setState({ filterConfig: newConfig });
    eventBus.emit(EventType.FILTER_CHANGE, newConfig);
  };

  const handleCompareToggle = (cityId: string) => {
    let newCompareCities: string[];
    
    if (filterConfig.compareCities.includes(cityId)) {
      newCompareCities = filterConfig.compareCities.filter(id => id !== cityId);
    } else if (filterConfig.compareCities.length < 3) {
      newCompareCities = [...filterConfig.compareCities, cityId];
    } else {
      return;
    }

    const newConfig = { ...filterConfig, compareCities: newCompareCities };
    useAppStore.setState({ filterConfig: newConfig });
    eventBus.emit(EventType.FILTER_CHANGE, newConfig);
    eventBus.emit(EventType.COMPARE_SELECT, newCompareCities);
  };

  const handleResetView = () => {
    eventBus.emit(EventType.RESET_VIEW);
  };

  const getCompareColor = (index: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];
    return colors[index] || '#ffffff';
  };

  return (
    <div style={styles.leftSidebar}>
      <div style={styles.sidebarHeader}>
        <h2 style={styles.sidebarTitle}>空气质量探索</h2>
      </div>

      <div style={styles.sidebarSection}>
        <h3 style={styles.sectionTitle}>大洲筛选</h3>
        <div style={styles.continentList}>
          {continents.map(continent => (
            <button
              key={continent}
              style={{
                ...styles.continentButton,
                backgroundColor: filterConfig.continent === continent ? '#BB86FC' : 'transparent',
                color: filterConfig.continent === continent ? '#0B0F19' : '#E0E0E0'
              }}
              onClick={() => handleContinentChange(continent)}
              onMouseEnter={(e) => {
                if (filterConfig.continent !== continent) {
                  e.currentTarget.style.backgroundColor = '#2A2A3E';
                }
              }}
              onMouseLeave={(e) => {
                if (filterConfig.continent !== continent) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {continentLabels[continent]}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.sidebarSection}>
        <h3 style={styles.sectionTitle}>城市对比 ({filterConfig.compareCities.length}/3)</h3>
        <input
          type="text"
          placeholder="搜索城市..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div style={styles.cityList}>
          {filteredCities.map(city => {
            const compareIndex = filterConfig.compareCities.indexOf(city.id);
            const isSelected = compareIndex !== -1;
            return (
              <div
                key={city.id}
                style={{
                  ...styles.cityItem,
                  borderColor: isSelected ? getCompareColor(compareIndex) : '#2A2A3E'
                }}
                onClick={() => handleCompareToggle(city.id)}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#2A2A3E';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={styles.cityItemName}>{city.name}</span>
                {isSelected && (
                  <div style={{
                    ...styles.compareIndicator,
                    backgroundColor: getCompareColor(compareIndex)
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.sidebarBottom}>
        <button style={styles.resetButton} onClick={handleResetView}>
          重置视角
        </button>
      </div>
    </div>
  );
}

function TimeSlider() {
  const { timeConfig } = useAppStore();
  const totalMonths = 72;

  const currentMonthIndex = getMonthIndex(timeConfig.year, timeConfig.month);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const monthIndex = parseInt(e.target.value);
    const year = 2020 + Math.floor(monthIndex / 12);
    const month = monthIndex % 12;
    
    const newConfig = { ...timeConfig, year, month };
    useAppStore.setState({ timeConfig: newConfig });
    eventBus.emit(EventType.TIME_CHANGE, monthIndex);
  };

  const togglePlay = () => {
    const newConfig = { ...timeConfig, isPlaying: !timeConfig.isPlaying };
    useAppStore.setState({ timeConfig: newConfig });
  };

  const changeSpeed = () => {
    const speeds: (1 | 2 | 4)[] = [1, 2, 4];
    const currentIndex = speeds.indexOf(timeConfig.playSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newConfig = { ...timeConfig, playSpeed: speeds[nextIndex] };
    useAppStore.setState({ timeConfig: newConfig });
  };

  useEffect(() => {
    if (!timeConfig.isPlaying) return;

    const intervalMs = 2000 / timeConfig.playSpeed;
    const interval = setInterval(() => {
      const { timeConfig: tc } = useAppStore.getState();
      let monthIndex = getMonthIndex(tc.year, tc.month);
      monthIndex = (monthIndex + 1) % totalMonths;
      
      const year = 2020 + Math.floor(monthIndex / 12);
      const month = monthIndex % 12;
      
      const newConfig = { ...tc, year, month };
      useAppStore.setState({ timeConfig: newConfig });
      eventBus.emit(EventType.TIME_CHANGE, monthIndex);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [timeConfig.isPlaying, timeConfig.playSpeed]);

  const formatDate = () => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    return `${timeConfig.year}年${months[timeConfig.month]}`;
  };

  return (
    <div style={styles.timeSliderContainer}>
      <div style={styles.timeDisplay}>{formatDate()}</div>
      
      <div style={styles.sliderWrapper}>
        <input
          type="range"
          min="0"
          max={totalMonths - 1}
          value={currentMonthIndex}
          onChange={handleTimeChange}
          style={styles.slider}
        />
        <div style={styles.sliderLabels}>
          <span style={styles.sliderLabel}>2020</span>
          <span style={styles.sliderLabel}>2021</span>
          <span style={styles.sliderLabel}>2022</span>
          <span style={styles.sliderLabel}>2023</span>
          <span style={styles.sliderLabel}>2024</span>
          <span style={styles.sliderLabel}>2025</span>
        </div>
      </div>

      <div style={styles.timeControls}>
        <button
          style={styles.playButton}
          onClick={togglePlay}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#9965E0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#BB86FC'; }}
        >
          {timeConfig.isPlaying ? '⏸' : '▶'}
        </button>
        <button
          style={styles.speedButton}
          onClick={changeSpeed}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2A2A3E'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          {timeConfig.playSpeed}x
        </button>
      </div>
    </div>
  );
}

function ComparePanel() {
  const { filterConfig, cities, timeConfig } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataType, setDataType] = useState<'aqi' | 'temperature' | 'humidity'>('aqi');

  const compareColors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];

  const compareCitiesData = filterConfig.compareCities.map(cityId => {
    return cities.find(c => c.id === cityId);
  }).filter(Boolean) as CityData[];

  useEffect(() => {
    if (!canvasRef.current || compareCitiesData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#A0A0A0';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';

    let maxValue: number, minValue: number;
    if (dataType === 'aqi') {
      maxValue = 200;
      minValue = 0;
    } else if (dataType === 'temperature') {
      maxValue = 40;
      minValue = -10;
    } else {
      maxValue = 100;
      minValue = 0;
    }

    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      const value = maxValue - ((maxValue - minValue) / 5) * i;
      ctx.fillText(Math.round(value).toString(), padding.left - 8, y + 4);
    }

    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const x = padding.left + (chartWidth / 5) * i;
      const year = 2020 + i;
      ctx.fillText(year.toString(), x, height - 8);
    }

    compareCitiesData.forEach((city, cityIndex) => {
      const data = city.monthlyData;
      const color = compareColors[cityIndex];

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.forEach((record, index) => {
        const x = padding.left + (index / (data.length - 1)) * chartWidth;
        const value = record[dataType as keyof ClimateRecord] as number;
        const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    });

    const currentMonthIndex = getMonthIndex(timeConfig.year, timeConfig.month);
    const currentX = padding.left + (currentMonthIndex / 71) * chartWidth;
    ctx.strokeStyle = '#BB86FC';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(currentX, padding.top);
    ctx.lineTo(currentX, height - padding.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

  }, [compareCitiesData, dataType, timeConfig]);

  if (compareCitiesData.length === 0) return null;

  return (
    <div style={styles.comparePanel}>
      <div style={styles.panelHeader}>
        <h3 style={styles.panelTitle}>城市对比</h3>
      </div>

      <div style={styles.dataTypeTabs}>
        {(['aqi', 'temperature', 'humidity'] as const).map(type => (
          <button
            key={type}
            style={{
              ...styles.dataTypeTab,
              backgroundColor: dataType === type ? '#BB86FC' : 'transparent',
              color: dataType === type ? '#0B0F19' : '#A0A0A0'
            }}
            onClick={() => setDataType(type)}
          >
            {type === 'aqi' ? 'AQI' : type === 'temperature' ? '温度' : '湿度'}
          </button>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        width={280}
        height={200}
        style={styles.chartCanvas}
      />

      <div style={styles.legend}>
        {compareCitiesData.map((city, index) => (
          <div key={city.id} style={styles.legendItem}>
            <div style={{ ...styles.legendColor, backgroundColor: compareColors[index] }} />
            <span style={styles.legendText}>{city.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LayerControls() {
  const { layerConfig } = useAppStore();

  const toggleLayer = (layer: keyof LayerConfig) => {
    const newConfig = { ...layerConfig, [layer]: !layerConfig[layer] };
    useAppStore.setState({ layerConfig: newConfig });
    eventBus.emit(EventType.LAYER_CHANGE, newConfig);
  };

  return (
    <div style={styles.layerControls}>
      <button
        style={{
          ...styles.layerButton,
          backgroundColor: layerConfig.heatmap ? '#BB86FC' : 'transparent',
          color: layerConfig.heatmap ? '#0B0F19' : '#E0E0E0'
        }}
        onClick={() => toggleLayer('heatmap')}
        onMouseEnter={(e) => {
          if (!layerConfig.heatmap) e.currentTarget.style.backgroundColor = '#2A2A3E';
        }}
        onMouseLeave={(e) => {
          if (!layerConfig.heatmap) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        热力图
      </button>
      <button
        style={{
          ...styles.layerButton,
          backgroundColor: layerConfig.windParticles ? '#BB86FC' : 'transparent',
          color: layerConfig.windParticles ? '#0B0F19' : '#E0E0E0'
        }}
        onClick={() => toggleLayer('windParticles')}
        onMouseEnter={(e) => {
          if (!layerConfig.windParticles) e.currentTarget.style.backgroundColor = '#2A2A3E';
        }}
        onMouseLeave={(e) => {
          if (!layerConfig.windParticles) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        风场粒子
      </button>
    </div>
  );
}

function Legend() {
  return (
    <div style={styles.legendPanel}>
      <h4 style={styles.legendTitle}>AQI 等级</h4>
      <div style={styles.legendGradient}>
        <div style={{ ...styles.legendItem, flex: 1, alignItems: 'center' }}>
          <div style={{ ...styles.legendColorBar, backgroundColor: '#00E676' }} />
          <span style={styles.legendLabel}>优</span>
        </div>
        <div style={{ ...styles.legendItem, flex: 1, alignItems: 'center' }}>
          <div style={{ ...styles.legendColorBar, backgroundColor: '#FFEB3B' }} />
          <span style={styles.legendLabel}>良</span>
        </div>
        <div style={{ ...styles.legendItem, flex: 1, alignItems: 'center' }}>
          <div style={{ ...styles.legendColorBar, backgroundColor: '#FF9800' }} />
          <span style={styles.legendLabel}>轻度</span>
        </div>
        <div style={{ ...styles.legendItem, flex: 1, alignItems: 'center' }}>
          <div style={{ ...styles.legendColorBar, backgroundColor: '#FF5722' }} />
          <span style={styles.legendLabel}>中度</span>
        </div>
        <div style={{ ...styles.legendItem, flex: 1, alignItems: 'center' }}>
          <div style={{ ...styles.legendColorBar, backgroundColor: '#FF1744' }} />
          <span style={styles.legendLabel}>重度</span>
        </div>
      </div>
    </div>
  );
}

export function UIModule() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRendererRef = useRef<any>(null);
  const { filterConfig, timeConfig } = useAppStore();

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = globalStyles;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    dataLoader.loadData();

    const handleDataUpdated = (data: CityData[]) => {
      useAppStore.setState({ cities: data });
    };

    const handleCityClick = (city: CityData) => {
      const currentMonthIndex = getMonthIndex(
        useAppStore.getState().timeConfig.year,
        useAppStore.getState().timeConfig.month
      );
      
      const fullCity = dataLoader.getCityById(city.id);
      if (fullCity) {
        const cityWithCurrentData = {
          ...fullCity,
          monthlyData: [fullCity.monthlyData[currentMonthIndex]]
        };
        useAppStore.setState({
          selectedCity: cityWithCurrentData,
          showInfoCard: true
        });
      }
    };

    const handleTimeChange = (monthIndex: number) => {
      const year = 2020 + Math.floor(monthIndex / 12);
      const month = monthIndex % 12;
      const selectedCity = useAppStore.getState().selectedCity;
      
      if (selectedCity) {
        const fullCity = dataLoader.getCityById(selectedCity.id);
        if (fullCity) {
          const cityWithCurrentData = {
            ...fullCity,
            monthlyData: [fullCity.monthlyData[monthIndex]]
          };
          useAppStore.setState({ selectedCity: cityWithCurrentData });
        }
      }
    };

    eventBus.on(EventType.DATA_UPDATED, handleDataUpdated);
    eventBus.on(EventType.CITY_CLICK, handleCityClick);
    eventBus.on(EventType.TIME_CHANGE, handleTimeChange);

    const initScene = async () => {
      const { SceneRenderer } = await import('../scene/SceneRenderer');
      if (containerRef.current) {
        sceneRendererRef.current = new SceneRenderer(containerRef.current);
      }
    };

    initScene();

    return () => {
      eventBus.off(EventType.DATA_UPDATED, handleDataUpdated);
      eventBus.off(EventType.CITY_CLICK, handleCityClick);
      eventBus.off(EventType.TIME_CHANGE, handleTimeChange);
      if (sceneRendererRef.current) {
        sceneRendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div style={styles.appContainer}>
      <div ref={containerRef} style={styles.sceneContainer} />
      
      <LeftSidebar />
      
      <div style={styles.topRightControls}>
        <LayerControls />
      </div>

      <Legend />

      <InfoCard />

      <TimeSlider />

      <ComparePanel />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden'
  },
  sceneContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0
  },
  leftSidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '260px',
    backgroundColor: '#1A1A2E',
    borderRight: '1px solid #2A2A3E',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10,
    boxShadow: '2px 0 10px rgba(0,0,0,0.5)'
  },
  sidebarHeader: {
    padding: '20px 16px',
    borderBottom: '1px solid #2A2A3E'
  },
  sidebarTitle: {
    color: '#E0E0E0',
    fontSize: '18px',
    fontWeight: 600,
    margin: 0
  },
  sidebarSection: {
    padding: '16px',
    borderBottom: '1px solid #2A2A3E'
  },
  sectionTitle: {
    color: '#A0A0A0',
    fontSize: '12px',
    fontWeight: 500,
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  continentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  continentButton: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '14px',
    transition: 'all 200ms ease-out',
    fontFamily: 'inherit'
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: '#0B0F19',
    border: '1px solid #2A2A3E',
    borderRadius: '8px',
    color: '#E0E0E0',
    fontSize: '13px',
    marginBottom: '12px',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  cityList: {
    maxHeight: '200px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  cityItem: {
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid',
    transition: 'all 200ms ease-out'
  },
  cityItemName: {
    color: '#E0E0E0',
    fontSize: '13px'
  },
  compareIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%'
  },
  sidebarBottom: {
    marginTop: 'auto',
    padding: '16px'
  },
  resetButton: {
    width: '100%',
    padding: '10px 16px',
    backgroundColor: '#2A2A3E',
    border: '1px solid #3A3A4E',
    borderRadius: '8px',
    color: '#E0E0E0',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 200ms ease-out',
    fontFamily: 'inherit'
  },
  topRightControls: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: 10
  },
  layerControls: {
    display: 'flex',
    gap: '8px',
    backgroundColor: '#121212',
    padding: '8px',
    borderRadius: '12px',
    border: '1px solid #2A2A3E',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
  },
  layerButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 200ms ease-out',
    fontFamily: 'inherit'
  },
  legendPanel: {
    position: 'absolute',
    bottom: '100px',
    right: '16px',
    backgroundColor: 'rgba(13, 17, 23, 0.9)',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid #2A2A3E',
    zIndex: 10
  },
  legendTitle: {
    color: '#E0E0E0',
    fontSize: '12px',
    marginBottom: '8px',
    fontWeight: 500
  },
  legendGradient: {
    display: 'flex',
    gap: '6px'
  },
  legendColorBar: {
    width: '24px',
    height: '8px',
    borderRadius: '2px',
    marginBottom: '4px'
  },
  legendLabel: {
    color: '#A0A0A0',
    fontSize: '10px'
  },
  timeSliderContainer: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '70%',
    maxWidth: '800px',
    backgroundColor: 'rgba(13, 17, 23, 0.9)',
    padding: '16px 24px',
    borderRadius: '12px',
    border: '1px solid #2A2A3E',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    zIndex: 10,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
  },
  timeDisplay: {
    color: '#E0E0E0',
    fontSize: '16px',
    fontWeight: 600,
    minWidth: '100px'
  },
  sliderWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: '#2A2A3E',
    outline: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer'
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  sliderLabel: {
    color: '#A0A0A0',
    fontSize: '11px'
  },
  timeControls: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  playButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#BB86FC',
    color: '#0B0F19',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 200ms ease-out',
    fontFamily: 'inherit'
  },
  speedButton: {
    padding: '8px 12px',
    border: '1px solid #2A2A3E',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#A0A0A0',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 200ms ease-out',
    fontFamily: 'inherit'
  },
  infoCard: {
    position: 'absolute',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(13, 17, 23, 0.9)',
    borderRadius: '12px',
    border: '1px solid #2A2A3E',
    padding: '16px 20px',
    minWidth: '200px',
    zIndex: 15,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
  },
  infoCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px'
  },
  cityName: {
    color: '#E0E0E0',
    fontSize: '18px',
    fontWeight: 600,
    margin: 0
  },
  aqiBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#0B0F19'
  },
  infoCardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  infoLabel: {
    color: '#A0A0A0',
    fontSize: '13px'
  },
  infoValue: {
    color: '#E0E0E0',
    fontSize: '14px',
    fontWeight: 500
  },
  comparePanel: {
    position: 'absolute',
    top: '80px',
    right: '16px',
    width: '320px',
    backgroundColor: '#121212',
    borderRadius: '16px',
    border: '1px solid #2A2A3E',
    padding: '20px',
    zIndex: 10,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
  },
  panelHeader: {
    marginBottom: '16px'
  },
  panelTitle: {
    color: '#E0E0E0',
    fontSize: '16px',
    fontWeight: 600,
    margin: 0
  },
  dataTypeTabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '16px',
    backgroundColor: '#0B0F19',
    padding: '4px',
    borderRadius: '8px'
  },
  dataTypeTab: {
    flex: 1,
    padding: '8px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'all 200ms ease-out',
    fontFamily: 'inherit'
  },
  chartCanvas: {
    width: '100%',
    height: '200px',
    borderRadius: '8px'
  },
  legend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '16px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  legendColor: {
    width: '12px',
    height: '12px',
    borderRadius: '50%'
  },
  legendText: {
    color: '#E0E0E0',
    fontSize: '13px'
  }
};

export default UIModule;
