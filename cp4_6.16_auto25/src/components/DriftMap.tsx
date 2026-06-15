import { useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { MapPin, User, Clock, BookOpen, AlertTriangle } from 'lucide-react';
import type { DriftRecord } from '@/types';
import { STATUS_COLORS, STATUS_LABELS } from '@/types';

interface DriftMapProps {
  records: DriftRecord[];
  selectedRecordId?: string;
  onSelectRecord?: (record: DriftRecord) => void;
}

interface PolylineData {
  key: string;
  positions: [number, number][];
  color: string;
}

interface MarkerData {
  record: DriftRecord;
  color: string;
  isSelected: boolean;
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

function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(Math.max((num >> 16) + amt, 0), 255);
  const G = Math.min(Math.max(((num >> 8) & 0x00ff) + amt, 0), 255);
  const B = Math.min(Math.max((num & 0x0000ff) + amt, 0), 255);
  return (
    '#' +
    (
      0x1000000 +
      R * 0x10000 +
      G * 0x100 +
      B
    )
      .toString(16)
      .slice(1)
  );
}

function createBookIcon(color: string, isSelected: boolean) {
  const scale = isSelected ? 1.25 : 1;
  const baseW = 32 * scale;
  const baseH = 44 * scale;
  const darkerColor = adjustColorBrightness(color, -20);
  const lighterColor = adjustColorBrightness(color, 20);
  const glowColor = color + '55';

  const bookSvg = `
    <svg viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="
      width: 100%;
      height: 100%;
      filter: ${isSelected
        ? `drop-shadow(0 4px 12px ${glowColor}) drop-shadow(0 2px 6px rgba(0,0,0,0.3))`
        : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'};
    ">
      <defs>
        <linearGradient id="bookGrad-${color.replace('#', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${lighterColor}" />
          <stop offset="50%" stop-color="${color}" />
          <stop offset="100%" stop-color="${darkerColor}" />
        </linearGradient>
        <linearGradient id="pageGrad-${color.replace('#', '')}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFFEF7" />
          <stop offset="100%" stop-color="#F5EFE0" />
        </linearGradient>
      </defs>

      <path d="M3 3 C3 1.89543 3.89543 1 5 1 L16 1 L16 42 L5 42 C3.89543 42 3 41.1046 3 40 L3 3 Z"
            fill="url(#bookGrad-${color.replace('#', '')})" stroke="#5C3620" stroke-width="1.2"/>

      <path d="M16 1 C16 1 20 2 23 2 C26.3137 2 29 4.68629 29 8 L29 38 C29 40.2091 27.2091 42 25 42 L23 42 L16 42 L16 1 Z"
            fill="url(#pageGrad-${color.replace('#', '')})" stroke="#5C3620" stroke-width="1"/>

      <path d="M16 1 L16 42" stroke="#5C3620" stroke-width="1.2" stroke-opacity="0.6"/>

      <path d="M5 1 L5 42" stroke="#5C3620" stroke-width="0.8" stroke-opacity="0.4"/>

      <path d="M18 6 L27 6" stroke="#C49B6E" stroke-width="0.8" stroke-linecap="round"/>
      <path d="M18 10 L26 10" stroke="#C49B6E" stroke-width="0.8" stroke-linecap="round"/>
      <path d="M18 14 L27 14" stroke="#C49B6E" stroke-width="0.8" stroke-linecap="round"/>
      <path d="M18 18 L25 18" stroke="#C49B6E" stroke-width="0.8" stroke-linecap="round"/>
      <path d="M18 22 L27 22" stroke="#C49B6E" stroke-width="0.8" stroke-linecap="round"/>

      <path d="M7 7 L14 7" stroke="rgba(255,255,255,0.5)" stroke-width="0.8" stroke-linecap="round"/>
      <path d="M7 11 L14 11" stroke="rgba(255,255,255,0.5)" stroke-width="0.8" stroke-linecap="round"/>
      <path d="M7 15 L13 15" stroke="rgba(255,255,255,0.5)" stroke-width="0.8" stroke-linecap="round"/>
      <path d="M7 19 L14 19" stroke="rgba(255,255,255,0.5)" stroke-width="0.8" stroke-linecap="round"/>
      <path d="M7 23 L13 23" stroke="rgba(255,255,255,0.5)" stroke-width="0.8" stroke-linecap="round"/>

      <path d="M29 34 C29 36.7614 27.7614 39 25 39 L16 39 L16 32 L25 32 C27.2091 32 29 33.7909 29 36 L29 34 Z"
            fill="${lighterColor}" stroke="#5C3620" stroke-width="0.8" stroke-opacity="0.8"/>

      <path d="M3 3 C3 2.44772 3.44772 2 4 2 L16 2 L16 3 L4 3 C3.44772 3 3 2.55228 3 2 Z"
            fill="#5C3620" fill-opacity="0.3"/>
      <path d="M3 41 C3 41.5523 3.44772 42 4 42 L16 42 L16 41 L4 41 C3.44772 41 3 41.5523 3 41 Z"
            fill="#5C3620" fill-opacity="0.3"/>
    </svg>
  `;

  return L.divIcon({
    className: `custom-book-marker${isSelected ? ' selected' : ''}`,
    html: `
      <div class="book-marker-wrapper" style="
        position: relative;
        width: ${baseW}px;
        height: ${baseH}px;
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform-origin: bottom center;
      ">
        ${bookSvg}
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: ${isSelected ? '8px' : '6px'} solid transparent;
          border-right: ${isSelected ? '8px' : '6px'} solid transparent;
          border-top: ${isSelected ? '12px' : '10px'} solid ${darkerColor};
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
        "></div>
        ${isSelected ? `
          <div style="
            position: absolute;
            top: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 20px;
            height: 20px;
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px ${glowColor};
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            font-weight: bold;
          ">✓</div>
        ` : ''}
      </div>
    `,
    iconSize: [baseW, baseH + 12],
    iconAnchor: [baseW / 2, baseH + 12],
    popupAnchor: [0, -(baseH + 16)],
  });
}

const MemoizedPolyline = memo(
  function MemoizedPolyline({ data }: { data: PolylineData }) {
    return (
      <Polyline
        key={data.key}
        positions={data.positions}
        pathOptions={{
          color: data.color,
          weight: 3,
          opacity: 0.7,
          dashArray: '8, 8',
        }}
      />
    );
  },
  (prev, next) => {
    return (
      prev.data.key === next.data.key &&
      prev.data.color === next.data.color &&
      JSON.stringify(prev.data.positions) === JSON.stringify(next.data.positions)
    );
  }
);

const MemoizedMarker = memo(
  function MemoizedMarker({
    markerData,
    markersRef,
    onSelect,
    onMouseOver,
    onMouseOut,
  }: {
    markerData: MarkerData;
    markersRef: React.MutableRefObject<Map<string, L.Marker>>;
    onSelect?: (record: DriftRecord) => void;
    onMouseOver: (id: string) => void;
    onMouseOut: (id: string) => void;
  }) {
    const { record, color, isSelected } = markerData;

    const icon = useMemo(
      () => createBookIcon(color, isSelected),
      [color, isSelected]
    );

    const handleClick = useCallback(() => {
      onSelect?.(record);
    }, [onSelect, record]);

    const handleMouseOver = useCallback(() => {
      onMouseOver(record.id);
    }, [onMouseOver, record.id]);

    const handleMouseOut = useCallback(() => {
      onMouseOut(record.id);
    }, [onMouseOut, record.id]);

    const formattedTime = useMemo(
      () => format(record.timestamp, 'yyyy-MM-dd HH:mm', { locale: zhCN }),
      [record.timestamp]
    );

    return (
      <Marker
        position={[record.toLat, record.toLng]}
        icon={icon}
        ref={(marker) => {
          if (marker) {
            markersRef.current.set(record.id, marker);
          }
        }}
        eventHandlers={{
          click: handleClick,
          mouseover: handleMouseOver,
          mouseout: handleMouseOut,
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
                <span>{formattedTime}</span>
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
  },
  (prev, next) => {
    const p = prev.markerData;
    const n = next.markerData;
    return (
      p.record.id === n.record.id &&
      p.color === n.color &&
      p.isSelected === n.isSelected &&
      p.record.toLat === n.record.toLat &&
      p.record.toLng === n.record.toLng &&
      p.record.toLocation === n.record.toLocation &&
      p.record.timestamp === n.record.timestamp &&
      p.record.statusChange === n.record.statusChange &&
      p.record.note === n.record.note &&
      p.record.operatorName === n.record.operatorName
    );
  }
);

function DriftMapComponent({
  records,
  selectedRecordId,
  onSelectRecord,
}: DriftMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const getRecordColor = useCallback(
    (record: DriftRecord, index: number) => {
      if (record.statusChange) {
        return STATUS_COLORS[record.statusChange];
      }
      const hue = (index * 40) % 360;
      return `hsl(${hue}, 60%, 45%)`;
    },
    []
  );

  useEffect(() => {
    return () => {
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-book-marker {
        background: transparent !important;
        border: none !important;
      }
      .custom-book-marker .book-marker-wrapper {
        animation: markerBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes markerBounceIn {
        0% { transform: scale(0) translateY(20px); opacity: 0; }
        60% { transform: scale(1.1) translateY(-4px); }
        100% { transform: scale(1) translateY(0); opacity: 1; }
      }
      .book-marker-hover .book-marker-wrapper {
        animation: markerHoverBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform: translateY(-6px) scale(1.08) !important;
      }
      @keyframes markerHoverBounce {
        0% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-10px) scale(1.12); }
        100% { transform: translateY(-6px) scale(1.08); }
      }
      .custom-book-marker.selected .book-marker-wrapper {
        transform: translateY(-4px) scale(1) !important;
      }
      .book-marker-hover.custom-book-marker.selected .book-marker-wrapper {
        transform: translateY(-10px) scale(1.1) !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleMarkerMouseOver = useCallback((recordId: string) => {
    const marker = markersRef.current.get(recordId);
    if (marker) {
      const el = marker.getElement();
      if (el) {
        el.classList.add('book-marker-hover');
      }
    }
  }, []);

  const handleMarkerMouseOut = useCallback((recordId: string) => {
    const marker = markersRef.current.get(recordId);
    if (marker) {
      const el = marker.getElement();
      if (el) {
        el.classList.remove('book-marker-hover');
      }
    }
  }, []);

  const { polylinesData, markersData, showPerfWarning } = useMemo(() => {
    const polylines: PolylineData[] = [];
    if (records.length > 1) {
      for (let i = 0; i < records.length - 1; i++) {
        const record = records[i];
        const nextRecord = records[i + 1];
        const color = getRecordColor(nextRecord, i + 1);
        polylines.push({
          key: `line-${record.id}-${nextRecord.id}`,
          positions: [
            [record.toLat, record.toLng],
            [nextRecord.toLat, nextRecord.toLng],
          ],
          color,
        });
      }
    }

    const markers: MarkerData[] = records.map((record, index) => ({
      record,
      color: getRecordColor(record, index),
      isSelected: selectedRecordId === record.id,
    }));

    return {
      polylinesData: polylines,
      markersData: markers,
      showPerfWarning: records.length > 30,
    };
  }, [records, selectedRecordId, getRecordColor]);

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
      {showPerfWarning && (
        <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700">
          <AlertTriangle size={14} />
          <span>标记点较多（{records.length}个），可能影响性能</span>
        </div>
      )}
      <div className={showPerfWarning ? 'h-[calc(100%-34px)]' : 'h-full'}>
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

          {polylinesData.map((data) => (
            <MemoizedPolyline key={data.key} data={data} />
          ))}

          {markersData.map((data) => (
            <MemoizedMarker
              key={data.record.id}
              markerData={data}
              markersRef={markersRef}
              onSelect={onSelectRecord}
              onMouseOver={handleMarkerMouseOver}
              onMouseOut={handleMarkerMouseOut}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

const MemoDriftMap = memo(
  DriftMapComponent,
  (prev, next) => {
    if (prev.selectedRecordId !== next.selectedRecordId) return false;
    if (prev.records.length !== next.records.length) return false;
    for (let i = 0; i < prev.records.length; i++) {
      const a = prev.records[i];
      const b = next.records[i];
      if (
        a.id !== b.id ||
        a.toLat !== b.toLat ||
        a.toLng !== b.toLng ||
        a.toLocation !== b.toLocation ||
        a.statusChange !== b.statusChange ||
        a.timestamp !== b.timestamp
      ) {
        return false;
      }
    }
    return true;
  }
);

export default MemoDriftMap;
