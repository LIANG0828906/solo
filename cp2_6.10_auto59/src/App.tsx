import { useEffect, useRef } from 'react';
import Astrolabe from '@/components/Astrolabe';
import WaterClock from '@/components/WaterClock';
import { useClockStore } from '@/store/useClockStore';
import {
  MIN_FLOW_RATE,
  MAX_FLOW_RATE,
  FLOW_STEP,
  COLORS,
  ERROR_THRESHOLD,
} from '@/utils/constants';

function App() {
  const animationRef = useRef<number>(0);
  const {
    flowRate,
    errorAngle,
    revolutionCount,
    pivotAngle,
    setFlowRate,
    tick,
    reset,
  } = useClockStore((state) => ({
    flowRate: state.flowRate,
    errorAngle: state.errorAngle,
    revolutionCount: state.revolutionCount,
    pivotAngle: state.pivotAngle,
    setFlowRate: state.setFlowRate,
    tick: state.tick,
    reset: state.reset,
  }));

  useEffect(() => {
    const animate = (currentTime: number) => {
      tick(currentTime);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [tick]);

  const handleFlowRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setFlowRate(value);
  };

  const handleReset = () => {
    reset();
  };

  const shiChenCount = (revolutionCount + pivotAngle / 360) * 2;
  const isErrorHigh = errorAngle > ERROR_THRESHOLD;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: `linear-gradient(180deg, ${COLORS.backgroundStart} 0%, ${COLORS.backgroundEnd} 100%)`,
        overflow: 'hidden',
        position: 'relative',
        fontFamily: '"SimSun", "STSong", serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: 0.03,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `2px solid ${COLORS.bronze}`,
            background: 'rgba(10, 10, 42, 0.8)',
          }}
        >
          <h1
            style={{
              color: COLORS.gold,
              fontSize: '24px',
              margin: 0,
              letterSpacing: '4px',
              textShadow: `0 0 10px ${COLORS.bronze}`,
              filter: 'contrast(1.2)',
            }}
          >
            水运仪象台 · 宋代天文仪器
          </h1>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '220px',
              borderRight: `2px solid ${COLORS.bronze}`,
              background: 'rgba(26, 26, 74, 0.9)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              filter: 'contrast(1.1)',
            }}
          >
            <div>
              <h3
                style={{
                  color: COLORS.gold,
                  fontSize: '16px',
                  margin: '0 0 12px 0',
                  borderBottom: `1px solid ${COLORS.bronze}`,
                  paddingBottom: '8px',
                }}
              >
                水斗泄水控制
              </h3>

              <div style={{ marginBottom: '12px' }}>
                <WaterClock />
              </div>

              <div style={{ marginTop: '16px' }}>
                <label
                  style={{
                    color: COLORS.bronzeLight,
                    fontSize: '14px',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  泄水速度: {flowRate.toFixed(1)} 升/秒
                </label>
                <input
                  type="range"
                  min={MIN_FLOW_RATE}
                  max={MAX_FLOW_RATE}
                  step={FLOW_STEP}
                  value={flowRate}
                  onChange={handleFlowRateChange}
                  style={{
                    width: '100%',
                    height: '8px',
                    background: COLORS.woodDeep,
                    borderRadius: '4px',
                    outline: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '4px',
                    fontSize: '12px',
                    color: COLORS.bronzeDark,
                  }}
                >
                  <span>{MIN_FLOW_RATE.toFixed(1)}</span>
                  <span>{MAX_FLOW_RATE.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 'auto',
                padding: '12px',
                border: `1px solid ${COLORS.bronze}`,
                borderRadius: '4px',
                background: 'rgba(10, 10, 42, 0.6)',
              }}
            >
              <div
                style={{
                  color: COLORS.gold,
                  fontSize: '13px',
                  marginBottom: '8px',
                }}
              >
                水斗水位
              </div>
              <div
                style={{
                  width: '100%',
                  height: '12px',
                  background: COLORS.woodDeep,
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: `1px solid ${COLORS.bronze}`,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${useClockStore.getState().waterLevel}%`,
                    background: `linear-gradient(90deg, ${COLORS.water} 0%, ${COLORS.waterLight} 100%)`,
                    transition: 'width 0.1s ease',
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '90%',
                height: '90%',
                maxWidth: '900px',
                maxHeight: '700px',
                border: `3px solid ${COLORS.bronze}`,
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: `0 0 30px rgba(184, 134, 11, 0.3), inset 0 0 50px rgba(10, 10, 42, 0.5)`,
                filter: 'contrast(1.1)',
              }}
            >
              <Astrolabe />
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                padding: '12px 16px',
                background: 'rgba(10, 10, 42, 0.9)',
                border: `2px solid ${isErrorHigh ? COLORS.crosshairRed : COLORS.bronze}`,
                borderRadius: '4px',
                minWidth: '140px',
              }}
            >
              <div
                style={{
                  color: COLORS.bronzeLight,
                  fontSize: '12px',
                  marginBottom: '4px',
                }}
              >
                窥管偏差
              </div>
              <div
                style={{
                  color: isErrorHigh ? COLORS.crosshairRed : COLORS.gold,
                  fontSize: '24px',
                  fontWeight: 'bold',
                  transition: 'color 0.3s ease',
                }}
              >
                {errorAngle.toFixed(1)}
                <span style={{ fontSize: '14px', marginLeft: '4px' }}>角分</span>
              </div>
              <div
                style={{
                  color: isErrorHigh ? COLORS.crosshairRed : COLORS.bronzeDark,
                  fontSize: '11px',
                  marginTop: '4px',
                }}
              >
                {isErrorHigh ? '⚠ 偏差超限' : '正常范围'}
              </div>
            </div>

            <button
              onClick={handleReset}
              style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: `radial-gradient(circle at 30% 30%, ${COLORS.bronzeLight} 0%, ${COLORS.bronze} 50%, ${COLORS.bronzeDark} 100%)`,
                border: `2px solid ${COLORS.gold}`,
                color: COLORS.gold,
                fontSize: '14px',
                fontFamily: '"SimSun", serif',
                cursor: 'pointer',
                boxShadow: `0 4px 15px rgba(184, 134, 11, 0.4)`,
                transition: 'all 0.2s ease',
                filter: 'contrast(1.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = `0 6px 20px rgba(255, 215, 0, 0.6)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = `0 4px 15px rgba(184, 134, 11, 0.4)`;
              }}
            >
              复位
            </button>
          </div>

          <div
            style={{
              width: '220px',
              borderLeft: `2px solid ${COLORS.bronze}`,
              background: 'rgba(26, 26, 74, 0.9)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              filter: 'contrast(1.1)',
            }}
          >
            <div>
              <h3
                style={{
                  color: COLORS.gold,
                  fontSize: '16px',
                  margin: '0 0 12px 0',
                  borderBottom: `1px solid ${COLORS.bronze}`,
                  paddingBottom: '8px',
                }}
              >
                枢轮传动状态
              </h3>

              <div
                style={{
                  padding: '16px',
                  background: 'rgba(10, 10, 42, 0.6)',
                  border: `1px solid ${COLORS.bronze}`,
                  borderRadius: '4px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    color: COLORS.bronzeLight,
                    fontSize: '12px',
                    marginBottom: '4px',
                  }}
                >
                  累计转数
                </div>
                <div
                  style={{
                    color: COLORS.gold,
                    fontSize: '28px',
                    fontWeight: 'bold',
                    fontFamily: '"Georgia", serif',
                  }}
                >
                  {shiChenCount.toFixed(2)}
                </div>
                <div
                  style={{
                    color: COLORS.bronzeDark,
                    fontSize: '12px',
                  }}
                >
                  时辰（1转 = 2时辰）
                </div>
              </div>

              <div
                style={{
                  padding: '12px',
                  background: 'rgba(10, 10, 42, 0.6)',
                  border: `1px solid ${COLORS.bronze}`,
                  borderRadius: '4px',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ color: COLORS.bronzeLight, fontSize: '12px' }}>
                    枢轮角度
                  </span>
                  <span style={{ color: COLORS.gold, fontSize: '14px' }}>
                    {pivotAngle.toFixed(1)}°
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: COLORS.bronzeLight, fontSize: '12px' }}>
                    传动比
                  </span>
                  <span style={{ color: COLORS.gold, fontSize: '14px' }}>
                    10:1
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 'auto',
                padding: '12px',
                border: `1px solid ${COLORS.bronze}`,
                borderRadius: '4px',
                background: 'rgba(10, 10, 42, 0.6)',
              }}
            >
              <div
                style={{
                  color: COLORS.gold,
                  fontSize: '13px',
                  marginBottom: '8px',
                }}
              >
                齿轮传动比
              </div>
              <div
                style={{
                  color: COLORS.bronzeLight,
                  fontSize: '12px',
                  lineHeight: '1.8',
                }}
              >
                <div>十二肘木 : 中轮 = 12 : 5</div>
                <div>中轮 : 天轮 = 5 : 120</div>
                <div style={{ color: COLORS.gold, marginTop: '8px' }}>
                  浑象角速度 = 枢轮 × 3.6
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '12px',
                border: `1px solid ${isErrorHigh ? COLORS.crosshairRed : COLORS.bronze}`,
                borderRadius: '4px',
                background: isErrorHigh
                  ? 'rgba(255, 0, 0, 0.1)'
                  : 'rgba(10, 10, 42, 0.6)',
              }}
            >
              <div
                style={{
                  color: isErrorHigh ? COLORS.crosshairRed : COLORS.gold,
                  fontSize: '13px',
                  marginBottom: '6px',
                }}
              >
                精度状态
              </div>
              <div
                style={{
                  color: COLORS.bronzeLight,
                  fontSize: '11px',
                  lineHeight: '1.6',
                }}
              >
                <div>误差限值: 5角分</div>
                <div>警告阈值: 2角分</div>
                <div style={{ marginTop: '6px', color: COLORS.gold }}>
                  当前流速: {flowRate.toFixed(1)} L/s
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            height: '40px',
            borderTop: `2px solid ${COLORS.bronze}`,
            background: 'rgba(10, 10, 42, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
          }}
        >
          <div
            style={{
              color: COLORS.bronzeDark,
              fontSize: '12px',
              letterSpacing: '2px',
            }}
          >
            宋代司天监 · 水运仪象台复原演示 · 拖动滑块调节水流 · 点击复位校准精度
          </div>
        </div>
      </div>

      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          background: radial-gradient(circle at 30% 30%, ${COLORS.bronzeLight} 0%, ${COLORS.bronzeSlider} 100%);
          border-radius: 50%;
          border: 2px solid ${COLORS.gold};
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }
        
        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 10px rgba(255, 215, 0, 0.5);
        }
        
        input[type='range']::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: radial-gradient(circle at 30% 30%, ${COLORS.bronzeLight} 0%, ${COLORS.bronzeSlider} 100%);
          border-radius: 50%;
          border: 2px solid ${COLORS.gold};
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default App;
