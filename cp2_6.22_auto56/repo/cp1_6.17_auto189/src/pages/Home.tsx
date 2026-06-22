import { useEffect, useRef, useState } from 'react';
import { ArtifactViewer } from '../ArtifactViewer';
import { InfoTooltip } from '../components/InfoTooltip';
import { SubtitleBar } from '../components/SubtitleBar';
import type { Artifact, NarrationState } from '../types/artifact';
import { DataService } from '../DataService';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ArtifactViewer | null>(null);
  const [hoveredArtifact, setHoveredArtifact] = useState<Artifact | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [narrationState, setNarrationState] = useState<NarrationState>({
    isPlaying: false,
    text: '',
    scrollPosition: 0,
  });
  const [narrationOpacity, setNarrationOpacity] = useState(0);
  const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [artifactList, setArtifactList] = useState<{ id: string; name: string; dynasty: string }[]>([]);

  useEffect(() => {
    const checkWidth = () => {
      setIsSidebarCollapsed(window.innerWidth < 1280);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new ArtifactViewer();
    viewerRef.current = viewer;

    viewer.init(containerRef.current, {
      onHoverArtifact: async (artifactId, screenPos) => {
        if (artifactId && screenPos) {
          try {
            const artifact = await DataService.getArtifact(artifactId);
            setHoveredArtifact(artifact);
            setHoverPosition(screenPos);
            setShowTooltip(true);
          } catch {
            setShowTooltip(false);
          }
        } else {
          setShowTooltip(false);
        }
      },
      onClickArtifact: async (artifactId) => {
        try {
          const artifact = await DataService.getArtifact(artifactId);
          setCurrentArtifact(artifact);
        } catch {
          // ignore
        }
      },
    });

    const narrationManager = viewer.getNarrationManager();
    narrationManager.subscribe((state) => {
      setNarrationState(state);
      setNarrationOpacity(narrationManager.getOpacity());
    });

    const loadInitial = async () => {
      try {
        const list = await DataService.getArtifacts();
        setArtifactList(list);
        const main = list.find((a) => a.id === 'bronze-ding') || list[0];
        if (main) {
          const artifact = await DataService.getArtifact(main.id);
          setCurrentArtifact(artifact);
        }
      } catch {
        // ignore
      }
    };
    loadInitial();

    let opacityInterval: number | null = null;
    const updateOpacity = () => {
      setNarrationOpacity(narrationManager.getOpacity());
      opacityInterval = requestAnimationFrame(updateOpacity);
    };
    opacityInterval = requestAnimationFrame(updateOpacity);

    return () => {
      if (opacityInterval) {
        cancelAnimationFrame(opacityInterval);
      }
      viewer.dispose();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          color: 'white',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontFamily: "'Georgia', 'SimSun', serif",
            fontWeight: 400,
            textShadow: '0 2px 10px rgba(0,0,0,0.8)',
          }}
        >
          古代器物数字化展馆
        </h1>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: 13,
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          拖拽旋转视角 · 滚轮缩放 · 悬停查看详情
        </p>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 10,
          width: isSidebarCollapsed ? 50 : 200,
          transition: 'width 0.3s ease',
        }}
      >
        <div
          style={{
            background: 'rgba(30, 30, 46, 0.85)',
            borderRadius: 12,
            padding: isSidebarCollapsed ? 12 : 16,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {!isSidebarCollapsed ? (
            <>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'white',
                  marginBottom: 12,
                  fontFamily: "'Georgia', 'SimSun', serif",
                }}
              >
                当前展品
              </div>
              {currentArtifact && (
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                  <div style={{ fontSize: 15, color: 'white', marginBottom: 4 }}>
                    {currentArtifact.name}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                    {currentArtifact.dynasty} · {currentArtifact.origin}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: 1.6,
                      color: 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {currentArtifact.description}
                  </div>
                </div>
              )}
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.4)',
                  lineHeight: 1.8,
                }}
              >
                <div>💡 按住 Ctrl + 点击匾额</div>
                <div style={{ marginLeft: 16 }}>可进入对比模式</div>
              </div>
            </>
          ) : (
            <div
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'upright',
                color: 'white',
                fontSize: 12,
                textAlign: 'center',
                padding: '8px 0',
                fontFamily: "'SimSun', serif",
              }}
            >
              展品
            </div>
          )}
        </div>

        {!isSidebarCollapsed && artifactList.length > 0 && (
          <div
            style={{
              marginTop: 12,
              background: 'rgba(30, 30, 46, 0.85)',
              borderRadius: 12,
              padding: 12,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.6)',
                marginBottom: 8,
              }}
            >
              展品列表
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {artifactList.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  onClick={() => viewerRef.current?.loadArtifact(item.id)}
                  style={{
                    background: currentArtifact?.id === item.id ? 'rgba(74,107,93,0.3)' : 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    color: 'white',
                    fontSize: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      currentArtifact?.id === item.id
                        ? 'rgba(74,107,93,0.3)'
                        : 'transparent';
                  }}
                >
                  {item.name}
                  <span
                    style={{
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: 10,
                      marginLeft: 4,
                    }}
                  >
                    {item.dynasty}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <InfoTooltip
        artifact={hoveredArtifact}
        position={hoverPosition}
        visible={showTooltip}
      />

      <SubtitleBar narrationState={narrationState} opacity={narrationOpacity} />

      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          color: 'rgba(255,255,255,0.4)',
          fontSize: 11,
          pointerEvents: 'none',
        }}
      >
        拉近视角至正面 · 自动触发语音解说
      </div>
    </div>
  );
}
