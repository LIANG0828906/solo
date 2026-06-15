import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { MapPin, User, Clock, BookOpen } from 'lucide-react';
import type { DriftRecord } from '@/types';
import { STATUS_COLORS, STATUS_LABELS } from '@/types';

interface DriftMapProps {
  records: DriftRecord[];
  selectedRecordId?: string;
  onSelectRecord?: (record: DriftRecord) => void;
}

function BoundsController({
  records,
  selectedRecordId,
}: {
  records: DriftRecord[];
  selectedRecordId?: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (records.length === 0) return;

    if (selectedRecordId) {
      const selected = records.find((r) => r.id === selectedRecordId);
      if (selected) {
        map.setView([selected.toLat, selected.toLng], 13, {
          animate: true,
          duration: 0.5,
        });
        return;
      }
    }

    const bounds = L.latLngBounds(
      records.map((r) => [r.toLat, r.toLng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50], animate: true });
  }, [records, selectedRecordId, map]);

  return null;
}

function createBookIcon(color: string, isSelected: boolean) {
  return L.divIcon({
    className: 'custom-book-marker',
    html: `
      <div style="
        position: relative;
        width: ${isSelected ? '40px' : '32px'};
        height: ${isSelected ? '48px' : '40px'};
        transition: all 0.2s ease;
      ">
        <svg viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        ">
          <path d="M4 2C4 0.89543 4.89543 0 6 0H20C21.1046 0 22 0.89543 22 2V28C22 29.1046 21.1046 30 20 30H6C4.89543 30 4 29.1046 4 28V2Z" fill="${color}" stroke="#5C3620" stroke-width="1.5"/>
          <path d="M4 2C4 0.895431 4.89543 0 6 0H12V30H6C4.89543 30 4 29.1046 4 28V2Z" fill="rgba(0,0,0,0.15)"/>
          <line x1="12" y1="4" x2="12" y2="26" stroke="#5C3620" stroke-width="1" stroke-opacity="0.3"/>
          <line x1="6" y1="6" x2="10" y2="6" stroke="white" stroke-width="1" stroke-opacity="0.6"/>
          <line x1="6" y1="9" x2="10" y2="9" stroke="white" stroke-width="1" stroke-opacity="0.6"/>
          <line x1="14" y1="6" x2="20" y2="6" stroke="white" stroke-width="1" stroke-opacity="0.4"/>
          <line x1="14" y1="9" x2="20" y2="9" stroke="white" stroke-width="1" stroke-opacity="0.4"/>
          <line x1="14" y1="12" x2="18" y2="12" stroke="white" stroke-width="1" stroke-opacity="0.4"/>
        </svg>
        ${isSelected ? `
          <div style="
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid ${color};
          "></div>
        ` : ''}
      </div>
    `,
    iconSize: isSelected ? [40, 54] : [32, 44],
    iconAnchor: isSelected ? [20, 54] : [16, 44],
    popupAnchor: [0, -50],
  });
}

export default function DriftMap({
  records,
  selectedRecordId,
  onSelectRecord,
}: DriftMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  const getRecordColor = (record: DriftRecord, index: number) => {
    if (record.statusChange) {
      return STATUS_COLORS[record.statusChange];
    }
    const hue = (index * 40) % 360;
    return `hsl(${hue}, 60%, 45%)`;
  };

  if (records.length === 0) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-oak-200 bg-cornsilk/50">
        <BookOpen className="mb-3 h-10 w-10 text-oak-300" />
        <div className="text-oak-500">暂无漂流记录</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-xl border-2 border-oak-200">
      <MapContainer
        center={[records[0]?.toLat || 39.9, records[0]?.toLng || 116.4]}
        zoom={5}
        className="h-full w-full"
        ref={(map) => {
          if (map) mapRef.current = map;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <BoundsController records={records} selectedRecordId={selectedRecordId} />

        {records.length > 1 &&
          records.slice(0, -1).map((record, index) => {
            const nextRecord = records[index + 1];
            const color = getRecordColor(nextRecord, index + 1);

            return (
              <Polyline
                key={`line-${record.id}-${nextRecord.id}`}
                positions={[
                  [record.toLat, record.toLng],
                  [nextRecord.toLat, nextRecord.toLng],
                ]}
                pathOptions={{
                  color,
                  weight: 3,
                  opacity: 0.7,
                  dashArray: '8, 8',
                }}
              />
            );
          })}

        {records.map((record, index) => {
          const isSelected = selectedRecordId === record.id;
          const color = getRecordColor(record, index);

          return (
            <Marker
              key={record.id}
              position={[record.toLat, record.toLng]}
              icon={createBookIcon(color, isSelected)}
              eventHandlers={{
                click: () => {
                  onSelectRecord?.(record);
                },
              }}
            >
              <Popup>
                <div className="min-w-[200px] font-sans">
                  <div className="mb-2 flex items-center gap-2 border-b border-oak-100 pb-2">
                    <MapPin className="h-4 w-4 text-oak-500" />
                    <span className="font-medium text-oak-800">
                      {record.toLocation || '未知地点'}
                    </span>
                    {record.statusChange && (
                      <span
                        className="ml-auto rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: STATUS_COLORS[record.statusChange] }}
                      >
                        {STATUS_LABELS[record.statusChange]}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-sm text-oak-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-oak-400" />
                      <span>
                        {format(record.timestamp, 'yyyy-MM-dd HH:mm', {
                          locale: zhCN,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-oak-400" />
                      <span>{record.operatorName}</span>
                    </div>
                    {record.note && (
                      <div className="pt-1 text-xs text-oak-500">{record.note}</div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
