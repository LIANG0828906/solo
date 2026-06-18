import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from './store';
import { COLOR_MAP, GROUP_COLORS } from './types';
import type { Member } from './types';

function FitBounds({ members }: { members: Member[] }) {
  const map = useMap();

  useEffect(() => {
    const validMembers = members.filter((m) => m.lat && m.lng);
    if (validMembers.length === 0) {
      map.setView([39.9042, 116.4074], 13);
      return;
    }

    const bounds = L.latLngBounds(validMembers.map((m) => [m.lat, m.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2));
    }
  }, [members, map]);

  return null;
}

function MemberMarker({ member, onClick }: { member: Member; onClick: () => void }) {
  const color = COLOR_MAP[GROUP_COLORS[member.groupIndex]] || '#3B82F6';

  const memberIcon = useMemo(() => {
    const size = member.pulseGreen ? 20 : 12;
    const pulseSize = member.pulseGreen ? 20 : 12;

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="position: relative; width: ${pulseSize * 2 + 40}px; height: ${pulseSize * 2 + 40}px; transform: translate(-50%, -50%);">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: ${color};
            opacity: 0.15;
            transform: translate(-50%, -50%);
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: ${member.pulseGreen ? '#10B981' : color};
            transform: translate(-50%, -50%);
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            border: 2px solid white;
            ${member.pulseGreen ? 'animation: pulse 1s ease-in-out infinite;' : ''}
            ${member.missing ? 'animation: blink 0.5s ease-in-out infinite;' : ''}
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: calc(50% + 14px);
            transform: translateY(-50%);
            font-size: 12px;
            color: white;
            background: rgba(0, 0, 0, 0.5);
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
            font-weight: 500;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
          ">${member.name}</div>
        </div>
      `,
      iconSize: [1, 1],
      iconAnchor: [0, 0],
    });
  }, [member, color]);

  if (!member.lat || !member.lng) return null;

  return (
    <Marker
      position={[member.lat, member.lng]}
      icon={memberIcon}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="member-popup">
          <div className="member-popup-name">{member.name}</div>
          <div className="member-popup-time">
            最近更新: {formatTime(member.lastUpdate)}
          </div>
          <div className="member-popup-trajectory">
            <div className="member-popup-trajectory-title">过去5分钟轨迹</div>
            <div className="trajectory-dots">
              {getTrajectoryDots(member).map((opacity, i) => (
                <div
                  key={i}
                  className="trajectory-dot"
                  style={{
                    backgroundColor: color,
                    opacity,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function getTrajectoryDots(member: Member): number[] {
  if (!member.history || member.history.length === 0) {
    return [0.2];
  }
  const dots: number[] = [];
  const count = Math.min(5, member.history.length + 1);
  for (let i = 0; i < count; i++) {
    const opacity = 0.2 + (0.8 * i) / (count - 1 || 1);
    dots.push(opacity);
  }
  return dots.reverse();
}

export default function MapView() {
  const { tourGroup, selectedMemberId, setSelectedMemberId, role } = useAppStore();

  const members = tourGroup?.members || [];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {role === 'leader' && tourGroup && (
        <div className="group-info-bar">
          <div className="group-name">{tourGroup.name}</div>
          <div className="group-meta">
            {tourGroup.date} · {members.filter((m) => m.isOnline).length}/{members.length} 人在线
          </div>
        </div>
      )}

      {role === 'member' && tourGroup && (
        <div className="group-info-bar">
          <div className="group-name">{tourGroup.name}</div>
          <div className="group-meta">团员模式 · 位置同步中</div>
        </div>
      )}

      <MapContainer
        center={[39.9042, 116.4074]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds members={members} />

        {members.map((member) => (
          <MemberMarker
            key={member.id}
            member={member}
            onClick={() => {
              if (role === 'leader') {
                setSelectedMemberId(member.id === selectedMemberId ? null : member.id);
              }
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
