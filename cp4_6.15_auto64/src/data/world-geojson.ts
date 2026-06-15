export interface CountryFeature {
  type: 'Feature';
  properties: {
    name: string;
    code: string;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface WorldGeoJSON {
  type: 'FeatureCollection';
  features: CountryFeature[];
}

const createSquare = (
  minLng: number,
  maxLng: number,
  minLat: number,
  maxLat: number,
  name: string,
  code: string
): CountryFeature => ({
  type: 'Feature',
  properties: { name, code },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
      ],
    ],
  },
});

export const worldGeoJSON: WorldGeoJSON = {
  type: 'FeatureCollection',
  features: [
    createSquare(73, 135, 18, 53, '中国', 'CN'),
    createSquare(-125, -66, 24, 49, '美国', 'US'),
    createSquare(129, 146, 30, 46, '日本', 'JP'),
    createSquare(-5, 10, 42, 51, '法国', 'FR'),
    createSquare(-8, 2, 50, 59, '英国', 'GB'),
    createSquare(5, 15, 47, 55, '德国', 'DE'),
    createSquare(6, 19, 36, 47, '意大利', 'IT'),
    createSquare(-74, -34, -34, 6, '巴西', 'BR'),
    createSquare(20, 180, 41, 82, '俄罗斯', 'RU'),
    createSquare(68, 97, 8, 36, '印度', 'IN'),
    createSquare(24, 37, 22, 32, '埃及', 'EG'),
    createSquare(113, 154, -44, -10, '澳大利亚', 'AU'),
    createSquare(-141, -52, 41, 84, '加拿大', 'CA'),
    createSquare(-10, 5, 35, 44, '西班牙', 'ES'),
    createSquare(-118, -86, 14, 33, '墨西哥', 'MX'),
    createSquare(124, 132, 33, 38, '韩国', 'KR'),
    createSquare(19, 29, 35, 42, '希腊', 'GR'),
    createSquare(97, 106, 5, 21, '泰国', 'TH'),
  ],
};

export const getCountryByName = (name: string): CountryFeature | undefined => {
  return worldGeoJSON.features.find((f) => f.properties.name === name);
};
