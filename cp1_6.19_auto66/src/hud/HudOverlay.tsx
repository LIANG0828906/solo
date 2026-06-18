import { useEffect, useState, useRef } from 'react';
import { useNavStore } from '../store/useNavStore';
import { computeNavData } from '../map/MapUtils';
import { NavData } from '../types';
import NavCompass from './NavCompass';
import DistanceIndicator from './DistanceIndicator';

const HudOverlay = () => {
  const { player, landmarks, targetId, showLockPrompt, showArrivalEffect, setShowArrivalEffect } =
    useNavStore();
  const [navData, setNavData] = useState<NavData | null>(null);
  const [compassSize, setCompassSize] = useState(120);
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const wasNearTargetRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 600) {
        setCompassSize(80);
      } else {
        setCompassSize(120);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= 16) {
        lastUpdateRef.current = timestamp;

        if (targetId) {
          const target = landmarks.find((l) => l.id === targetId);
          if (target) {
            const data = computeNavData(player.position, player.facing, target.position);
            setNavData(data);

            if (data.isNearTarget && !wasNearTargetRef.current) {
              setShowArrivalEffect(true);
              setTimeout(() => setShowArrivalEffect(false), 500);
              wasNearTargetRef.current = true;
            } else if (!data.isNearTarget) {
              wasNearTargetRef.current = false;
            }
          }
        } else {
          setNavData(null);
          wasNearTargetRef.current = false;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [player, landmarks, targetId, setShowArrivalEffect]);

  const targetLandmark = targetId ? landmarks.find((l) => l.id === targetId) : null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            pointerEvents: 'auto',
          }}
        >
          <NavCompass
            targetAngle={navData ? navData.azimuth : null}
            playerFacing={player.facing}
            isFacingAway={navData?.isFacingAway || false}
            size={compassSize}
          />
          {targetLandmark && (
            <div
              style={{
                marginTop: '12px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 15, 30, 0.6)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                textAlign: 'center',
                maxWidth: compassSize,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: targetLandmark.color,
                  marginRight: '6px',
                  verticalAlign: 'middle',
                  boxShadow: `0 0 8px ${targetLandmark.color}`,
                }}
              />
              目标：{targetLandmark.name}
            </div>
          )}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            pointerEvents: 'auto',
          }}
        >
          <DistanceIndicator
            distance={navData ? navData.distance : null}
            heightDiff={navData ? navData.heightDiff : null}
            isFacingAway={navData?.isFacingAway || false}
            isNearTarget={navData?.isNearTarget || false}
          />
        </div>

        {showLockPrompt && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              padding: '16px 32px',
              borderRadius: '12px',
              background: 'rgba(15, 15, 30, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 215, 0, 0.5)',
              color: '#FFD700',
              fontSize: '20px',
              fontWeight: 'bold',
              boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)',
              animation: 'slideDown 0.5s ease-out forwards',
              textShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
              whiteSpace: 'nowrap',
            }}
          >
            ✦ 已锁定目标！ ✦
          </div>
        )}

        {showArrivalEffect && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle, rgba(74, 222, 128, 0.3) 0%, transparent 70%)',
              animation: 'arrivalFlash 0.5s ease-out',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          0% {
            opacity: 0;
            transform: translate(-50%, -150%);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        @keyframes arrivalFlash {
          0% {
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          40% {
            opacity: 0.3;
          }
          60% {
            opacity: 1;
          }
          80% {
            opacity: 0.3;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};

export default HudOverlay;
