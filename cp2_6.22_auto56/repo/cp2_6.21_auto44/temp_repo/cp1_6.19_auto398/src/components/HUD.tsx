import { useGameStore } from '../store/gameStore';

interface HUDProps {
  variant: 'left' | 'right';
  compact?: boolean;
}

function StateIndicatorDot({ state }: { state: string }) {
  let color = '#FFC107';
  let label = '巡逻中';
  if (state === 'chasing') { color = '#F44336'; label = '追击'; }
  else if (state === 'retreating') { color = '#2196F3'; label = '撤退'; }
  else if (state === 'cooldown') { color = '#9C27B0'; label = '冷却'; }
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <div style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 8px ${color}`,
        animation: state === 'chasing' ? 'pulseDot 0.8s infinite' : 'none'
      }} />
      <span style={{ fontSize: '11px', color: '#999' }}>{label}</span>
    </div>
  );
}

export default function HUD({ variant, compact = false }: HUDProps) {
  const { player, monsters } = useGameStore(s => s.state);
  const aliveMonsters = monsters.filter(m => m.alive);
  const deadCount = monsters.length - aliveMonsters.length;
  
  if (variant === 'left') {
    const healthPct = (player.health / player.maxHealth) * 100;
    const lightPct = Math.round(player.lightIntensity * 100);
    
    return (
      <div style={{
        width: compact ? '280px' : '240px',
        background: 'rgba(30, 30, 30, 0.85)',
        backdropFilter: 'blur(8px)',
        borderRadius: '12px',
        border: '1px solid #FFB300',
        padding: compact ? '14px 16px' : '20px 18px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        flexShrink: 0
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#FFB300',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          letterSpacing: '1px'
        }}>
          <span style={{ fontSize: '16px' }}>⚔️</span>
          <span>角色状态</span>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px'
          }}>
            <span style={{ fontSize: '12px', color: '#B0B0B0' }}>生命值</span>
            <span style={{ fontSize: '12px', color: '#F44336', fontWeight: 'bold' }}>
              {player.health} / {player.maxHealth}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '20px',
            background: '#1A1A1A',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              height: '100%',
              width: `${healthPct}%`,
              background: 'linear-gradient(90deg, #F44336 0%, #B71C1C 100%)',
              borderRadius: '4px',
              transition: 'width 0.3s ease-out',
              boxShadow: '0 0 10px rgba(244, 67, 54, 0.5)'
            }} />
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px'
            }}>
              {Array.from({ length: player.maxHealth }).map((_, i) => (
                <span key={i} style={{
                  fontSize: '10px',
                  color: i < player.health ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  opacity: i < player.health ? 1 : 0.4
                }}>♥</span>
              ))}
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px'
          }}>
            <span style={{ fontSize: '12px', color: '#B0B0B0' }}>光照强度</span>
            <span style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: player.lightIntensity > 0.6 ? '#FFD54F' : 
                     player.lightIntensity > 0.3 ? '#BDBDBD' : '#5C6BC0'
            }}>
              {lightPct}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: '#1A1A1A',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${lightPct}%`,
              background: player.lightIntensity > 0.6 
                ? 'linear-gradient(90deg, #FF8F00, #FFD54F)'
                : player.lightIntensity > 0.3
                ? 'linear-gradient(90deg, #616161, #9E9E9E)'
                : 'linear-gradient(90deg, #283593, #5C6BC0)',
              borderRadius: '4px',
              transition: 'width 0.3s, background 0.3s'
            }} />
          </div>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '12px', color: '#B0B0B0' }}>活动区域</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '12px',
              background: player.state === 'bright' ? 'rgba(255, 213, 79, 0.15)' :
                         player.state === 'dim' ? 'rgba(158, 158, 158, 0.15)' :
                         'rgba(92, 107, 192, 0.15)',
              border: `1px solid ${player.state === 'bright' ? '#FFD54F' :
                         player.state === 'dim' ? '#9E9E9E' : '#5C6BC0'}`
            }}>
              <span>{player.state === 'bright' ? '☀️' : player.state === 'dim' ? '🌗' : '🌙'}</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 'bold',
                color: player.state === 'bright' ? '#FFD54F' :
                       player.state === 'dim' ? '#BDBDBD' : '#9FA8DA'
              }}>
                {player.state === 'bright' ? '明亮区' : player.state === 'dim' ? '半明区' : '黑暗区'}
              </span>
            </div>
          </div>
        </div>
        
        <div style={{
          paddingTop: '14px',
          borderTop: '1px solid rgba(255, 179, 0, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '12px', color: '#B0B0B0' }}>击败怪物</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '20px', color: '#FFB300', fontWeight: 'bold', textShadow: '0 0 10px rgba(255, 179, 0, 0.5)' }}>
                {deadCount}
              </span>
              <span style={{ fontSize: '12px', color: '#666' }}>/ {monsters.length}</span>
            </div>
          </div>
          {deadCount > 0 && (
            <div style={{
              marginTop: '6px',
              display: 'flex',
              gap: '3px'
            }}>
              {Array.from({ length: deadCount }).map((_, i) => (
                <span key={i} style={{ fontSize: '12px' }}>💀</span>
              ))}
            </div>
          )}
        </div>
        
        <style>{`
          @keyframes pulseDot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.2); }
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <div style={{
      width: compact ? '280px' : '240px',
      background: 'rgba(30, 30, 30, 0.85)',
      backdropFilter: 'blur(8px)',
      borderRadius: '12px',
      border: '1px solid #FFB300',
      padding: compact ? '14px 16px' : '20px 18px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      flexShrink: 0,
      maxHeight: compact ? 'auto' : '560px',
      overflowY: 'auto'
    }}>
      <div style={{
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#FFB300',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        letterSpacing: '1px'
      }}>
        <span style={{ fontSize: '16px' }}>👹</span>
        <span>怪物列表</span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '11px',
          background: 'rgba(255, 179, 0, 0.2)',
          padding: '2px 8px',
          borderRadius: '10px',
          color: '#FFB300'
        }}>
          存活 {aliveMonsters.length}
        </span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {monsters.map((monster, idx) => {
          const isLightChaser = monster.type === 'lightChaser';
          const bgColor = isLightChaser ? 'rgba(229, 57, 53, 0.1)' : 'rgba(171, 71, 188, 0.1)';
          const borderColor = isLightChaser ? 'rgba(229, 57, 53, 0.3)' : 'rgba(171, 71, 188, 0.3)';
          const headColor = isLightChaser ? '#E53935' : '#AB47BC';
          const typeLabel = isLightChaser ? '追光者' : '避光者';
          
          return (
            <div
              key={monster.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '8px',
                background: monster.alive ? bgColor : 'rgba(60, 60, 60, 0.2)',
                border: `1px solid ${monster.alive ? borderColor : 'rgba(100,100,100,0.2)'}`,
                opacity: monster.alive ? 1 : 0.4,
                transition: 'opacity 0.3s',
                position: 'relative'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: monster.alive ? headColor : '#555',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: monster.alive ? `0 0 10px ${headColor}40` : 'none',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', gap: '3px' }}>
                  <div style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: monster.alive ? '#FFF' : '#777'
                  }} />
                  <div style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: monster.alive ? '#FFF' : '#777'
                  }} />
                </div>
                {!monster.alive && (
                  <div style={{
                    position: 'absolute',
                    fontSize: '16px',
                    top: '-2px'
                  }}>✕</div>
                )}
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '3px'
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: monster.alive ? (isLightChaser ? '#EF9A9A' : '#CE93D8') : '#777'
                  }}>
                    {typeLabel} #{idx + 1}
                  </span>
                  {monster.alive && <StateIndicatorDot state={monster.state} />}
                </div>
                
                {monster.alive && (
                  <div style={{
                    width: '100%',
                    height: '4px',
                    background: '#1A1A1A',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(monster.health / monster.maxHealth) * 100}%`,
                      background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
                      transition: 'width 0.2s'
                    }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={{
        marginTop: '16px',
        paddingTop: '14px',
        borderTop: '1px solid rgba(255, 179, 0, 0.2)'
      }}>
        <div style={{
          fontSize: '11px',
          color: '#888',
          lineHeight: 1.6
        }}>
          <div style={{ marginBottom: '6px', fontWeight: 'bold', color: '#FFB300' }}>图例说明：</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F44336' }} />
            <span>追击 - 锁定目标</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFC107' }} />
            <span>巡逻 - 随机游荡</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2196F3' }} />
            <span>撤退 - 返回安全区</span>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
