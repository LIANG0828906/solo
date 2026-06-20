import { useEffect } from 'react';
import { getProvinces, getCities, getRegions } from '@/lib/regions';

interface Props {
  province: string;
  city: string;
  region: string;
  onChange: (province: string, city: string, region: string) => void;
}

export default function RegionSelect({ province, city, region, onChange }: Props) {
  const provinces = getProvinces();
  const cities = province ? getCities(province) : [];
  const regions = province && city ? getRegions(province, city) : [];

  useEffect(() => {
    if (province && !cities.includes(city)) {
      onChange(province, '', '');
    } else if (city && !regions.includes(region)) {
      onChange(province, city, '');
    }
  }, [province, city, region, cities, regions, onChange]);

  return (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="tea-label">省份</label>
        <select
          className="tea-input"
          value={province}
          onChange={(e) => onChange(e.target.value, '', '')}
        >
          <option value="">请选择</option>
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="tea-label">城市</label>
        <select
          className="tea-input"
          value={city}
          disabled={!province}
          onChange={(e) => onChange(province, e.target.value, '')}
        >
          <option value="">请选择</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="tea-label">产区</label>
        <select
          className="tea-input"
          value={region}
          disabled={!city}
          onChange={(e) => onChange(province, city, e.target.value)}
        >
          <option value="">请选择</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
