export type Season = "spring" | "summer" | "autumn" | "winter";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface OceanCurrent {
  id: string;
  name: string;
  nameEn: string;
  type: "warm" | "cold";
  colorStart: string;
  colorEnd: string;
  points: LatLng[];
  seasonal?: boolean;
}

function latLngTo3D(lat: number, lng: number, radius = 2.02): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

function samplePath(start: LatLng, end: LatLng, steps: number): LatLng[] {
  const result: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    result.push({
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t,
    });
  }
  return result;
}

function smoothPath(points: LatLng[], pointsPerSegment = 12): LatLng[] {
  const result: LatLng[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const seg = samplePath(points[i], points[i + 1], pointsPerSegment);
    if (i > 0) seg.shift();
    result.push(...seg);
  }
  return result;
}

export const MAIN_CURRENTS: OceanCurrent[] = [
  {
    id: "gulf-stream",
    name: "墨西哥湾暖流",
    nameEn: "Gulf Stream",
    type: "warm",
    colorStart: "#ff2d2d",
    colorEnd: "#ff9a3c",
    points: smoothPath(
      [
        { lat: 25, lng: -80 },
        { lat: 30, lng: -70 },
        { lat: 38, lng: -60 },
        { lat: 45, lng: -45 },
        { lat: 50, lng: -30 },
        { lat: 52, lng: -15 },
      ],
      12
    ),
  },
  {
    id: "north-atlantic",
    name: "北大西洋暖流",
    nameEn: "North Atlantic Drift",
    type: "warm",
    colorStart: "#ff6a3d",
    colorEnd: "#ffc069",
    points: smoothPath(
      [
        { lat: 52, lng: -15 },
        { lat: 55, lng: 0 },
        { lat: 58, lng: 10 },
        { lat: 62, lng: 20 },
        { lat: 68, lng: 30 },
      ],
      12
    ),
  },
  {
    id: "kuroshio",
    name: "黑潮暖流",
    nameEn: "Kuroshio Current",
    type: "warm",
    colorStart: "#ff3b5c",
    colorEnd: "#ffb347",
    points: smoothPath(
      [
        { lat: 15, lng: 130 },
        { lat: 22, lng: 135 },
        { lat: 30, lng: 140 },
        { lat: 35, lng: 145 },
        { lat: 40, lng: 155 },
        { lat: 45, lng: 170 },
      ],
      12
    ),
  },
  {
    id: "antarctic-circumpolar",
    name: "南极绕极流",
    nameEn: "Antarctic Circumpolar",
    type: "cold",
    colorStart: "#0066ff",
    colorEnd: "#00e0ff",
    points: smoothPath(
      [
        { lat: -55, lng: -180 },
        { lat: -55, lng: -120 },
        { lat: -55, lng: -60 },
        { lat: -55, lng: 0 },
        { lat: -55, lng: 60 },
        { lat: -55, lng: 120 },
        { lat: -55, lng: 179 },
      ],
      10
    ),
  },
  {
    id: "humboldt",
    name: "秘鲁寒流（洪堡德洋流）",
    nameEn: "Humboldt Current",
    type: "cold",
    colorStart: "#1e5cff",
    colorEnd: "#28d6ff",
    points: smoothPath(
      [
        { lat: -50, lng: -75 },
        { lat: -35, lng: -78 },
        { lat: -20, lng: -80 },
        { lat: -5, lng: -82 },
        { lat: 5, lng: -85 },
      ],
      12
    ),
  },
  {
    id: "california",
    name: "加利福尼亚寒流",
    nameEn: "California Current",
    type: "cold",
    colorStart: "#2a6fff",
    colorEnd: "#3fd8ff",
    points: smoothPath(
      [
        { lat: 48, lng: -130 },
        { lat: 40, lng: -125 },
        { lat: 32, lng: -120 },
        { lat: 22, lng: -115 },
      ],
      12
    ),
  },
];

function buildSomaliCurrent(season: Season): OceanCurrent {
  if (season === "summer") {
    return {
      id: "somali-warm",
      name: "索马里暖流（夏季）",
      nameEn: "Somali Warm Current",
      type: "warm",
      colorStart: "#ff4b3c",
      colorEnd: "#ffae4a",
      seasonal: true,
      points: smoothPath(
        [
          { lat: -10, lng: 45 },
          { lat: 0, lng: 50 },
          { lat: 10, lng: 52 },
          { lat: 18, lng: 55 },
        ],
        12
      ),
    };
  }
  return {
    id: "somali-cold",
    name: "索马里寒流（冬季）",
    nameEn: "Somali Cold Current",
    type: "cold",
    colorStart: "#1b6bff",
    colorEnd: "#36d1ff",
    seasonal: true,
    points: smoothPath(
      [
        { lat: 18, lng: 55 },
        { lat: 10, lng: 52 },
        { lat: 0, lng: 50 },
        { lat: -10, lng: 45 },
      ],
      12
    ),
  };
}

function buildIndianMonsoon(season: Season): OceanCurrent {
  if (season === "summer") {
    return {
      id: "indian-summer",
      name: "印度洋夏季季风洋流",
      nameEn: "Indian Summer Monsoon",
      type: "warm",
      colorStart: "#ff5533",
      colorEnd: "#ffbb55",
      seasonal: true,
      points: smoothPath(
        [
          { lat: 5, lng: 60 },
          { lat: 10, lng: 72 },
          { lat: 15, lng: 85 },
          { lat: 18, lng: 95 },
        ],
        12
      ),
    };
  }
  return {
    id: "indian-winter",
    name: "印度洋冬季季风洋流",
    nameEn: "Indian Winter Monsoon",
    type: "cold",
    colorStart: "#1f60ff",
    colorEnd: "#4ad4ff",
    seasonal: true,
    points: smoothPath(
      [
        { lat: 18, lng: 95 },
        { lat: 12, lng: 82 },
        { lat: 8, lng: 70 },
        { lat: 5, lng: 60 },
      ],
      12
    ),
  };
}

function buildArcticIceEdge(season: Season): OceanCurrent {
  const latOffset = season === "summer" ? 8 : -6;
  return {
    id: "arctic-ice-edge",
    name: "北极冰缘洋流",
    nameEn: "Arctic Ice Edge Current",
    type: "cold",
    colorStart: "#0052ff",
    colorEnd: "#70e7ff",
    seasonal: true,
    points: smoothPath(
      [
        { lat: 72 + latOffset, lng: -150 },
        { lat: 75 + latOffset, lng: -100 },
        { lat: 78 + latOffset, lng: -40 },
        { lat: 76 + latOffset, lng: 30 },
        { lat: 74 + latOffset, lng: 100 },
        { lat: 73 + latOffset, lng: 160 },
      ],
      10
    ),
  };
}

function buildOkhotsk(season: Season): OceanCurrent {
  if (season === "winter" || season === "autumn") {
    return {
      id: "okhotsk-cold",
      name: "鄂霍次克寒流",
      nameEn: "Okhotsk Cold Current",
      type: "cold",
      colorStart: "#103bff",
      colorEnd: "#5fd0ff",
      seasonal: true,
      points: smoothPath(
        [
          { lat: 60, lng: 145 },
          { lat: 55, lng: 142 },
          { lat: 48, lng: 142 },
          { lat: 42, lng: 143 },
        ],
        12
      ),
    };
  }
  return {
    id: "okhotsk-warm",
    name: "鄂霍次克暖流",
    nameEn: "Okhotsk Warm Current",
    type: "warm",
    colorStart: "#ff4833",
    colorEnd: "#ffc25c",
    seasonal: true,
    points: smoothPath(
      [
        { lat: 42, lng: 143 },
        { lat: 48, lng: 142 },
        { lat: 55, lng: 142 },
        { lat: 60, lng: 145 },
      ],
      12
    ),
  };
}

export function getMainCurrents(): OceanCurrent[] {
  return MAIN_CURRENTS;
}

export function getSeasonalCurrents(season: Season): OceanCurrent[] {
  return [
    buildSomaliCurrent(season),
    buildIndianMonsoon(season),
    buildArcticIceEdge(season),
    buildOkhotsk(season),
  ];
}

export function latLngToVec3(lat: number, lng: number, radius = 2.02): [number, number, number] {
  return latLngTo3D(lat, lng, radius);
}

export function sampleCurrentColor(
  current: OceanCurrent,
  progress: number
): string {
  const t = Math.max(0, Math.min(1, progress));
  const c1 = hexToRgb(current.colorStart);
  const c2 = hexToRgb(current.colorEnd);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r},${g},${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}
