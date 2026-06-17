import React, { useState, useRef, useEffect } from 'react';
import { Check, MapPin } from 'lucide-react';
import { useAppStore } from '../store';
import { City, BirthInfo } from '../types';

const cities: City[] = [
  { name: '北京', country: '中国', latitude: 39.9042, longitude: 116.4074, timezone: 'Asia/Shanghai' },
  { name: '上海', country: '中国', latitude: 31.2304, longitude: 121.4737, timezone: 'Asia/Shanghai' },
  { name: '广州', country: '中国', latitude: 23.1291, longitude: 113.2644, timezone: 'Asia/Shanghai' },
  { name: '深圳', country: '中国', latitude: 22.5431, longitude: 114.0579, timezone: 'Asia/Shanghai' },
  { name: '成都', country: '中国', latitude: 30.5728, longitude: 104.0668, timezone: 'Asia/Shanghai' },
  { name: '杭州', country: '中国', latitude: 30.2741, longitude: 120.1551, timezone: 'Asia/Shanghai' },
  { name: '南京', country: '中国', latitude: 32.0603, longitude: 118.7969, timezone: 'Asia/Shanghai' },
  { name: '武汉', country: '中国', latitude: 30.5928, longitude: 114.3055, timezone: 'Asia/Shanghai' },
  { name: '西安', country: '中国', latitude: 34.3416, longitude: 108.9398, timezone: 'Asia/Shanghai' },
  { name: '重庆', country: '中国', latitude: 29.4316, longitude: 106.9123, timezone: 'Asia/Shanghai' },
  { name: '香港', country: '中国', latitude: 22.3193, longitude: 114.1694, timezone: 'Asia/Hong_Kong' },
  { name: '台北', country: '中国', latitude: 25.0330, longitude: 121.5654, timezone: 'Asia/Taipei' },
  { name: '东京', country: '日本', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
  { name: '首尔', country: '韩国', latitude: 37.5665, longitude: 126.9780, timezone: 'Asia/Seoul' },
  { name: '新加坡', country: '新加坡', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore' },
  { name: '纽约', country: '美国', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
  { name: '伦敦', country: '英国', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { name: '巴黎', country: '法国', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
  { name: '悉尼', country: '澳大利亚', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' },
  { name: '莫斯科', country: '俄罗斯', latitude: 55.7558, longitude: 37.6173, timezone: 'Europe/Moscow' },
];

const timezones = [
  { value: 'Asia/Shanghai', label: '中国标准时间 (UTC+8)' },
  { value: 'Asia/Tokyo', label: '日本标准时间 (UTC+9)' },
  { value: 'Asia/Seoul', label: '韩国标准时间 (UTC+9)' },
  { value: 'Asia/Singapore', label: '新加坡时间 (UTC+8)' },
  { value: 'Asia/Hong_Kong', label: '香港时间 (UTC+8)' },
  { value: 'Asia/Taipei', label: '台北时间 (UTC+8)' },
  { value: 'America/New_York', label: '美国东部时间 (UTC-5/-4)' },
  { value: 'America/Los_Angeles', label: '美国太平洋时间 (UTC-8/-7)' },
  { value: 'Europe/London', label: '格林威治时间 (UTC+0/+1)' },
  { value: 'Europe/Paris', label: '中欧时间 (UTC+1/+2)' },
  { value: 'Australia/Sydney', label: '澳大利亚东部时间 (UTC+10/+11)' },
  { value: 'Europe/Moscow', label: '莫斯科时间 (UTC+3)' },
];

const InputPanel: React.FC = () => {
  const { birthInfo, setBirthInfo } = useAppStore();
  const [cityQuery, setCityQuery] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [timezoneValid, setTimezoneValid] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(cityQuery.toLowerCase()) ||
    city.country.toLowerCase().includes(cityQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCitySelect = (city: City) => {
    setCityQuery(city.name);
    setShowCityDropdown(false);
    setBirthInfo({
      city: city.name,
      timezone: city.timezone,
      latitude: city.latitude,
      longitude: city.longitude,
    });
  };

  const handleInputChange = (field: keyof BirthInfo, value: string | number) => {
    setBirthInfo({ [field]: value });
    if (field === 'timezone') {
      setTimezoneValid(timezones.some(tz => tz.value === value));
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const [birthHour, birthMinute] = birthInfo.time.split(':');

  return (
    <div className="input-panel">
      <h2 className="panel-title">输入出生信息</h2>
      
      <div className="input-group">
        <label className="input-label">出生日期</label>
        <input
          type="date"
          className="input-field"
          value={birthInfo.date}
          onChange={(e) => handleInputChange('date', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="input-group">
        <label className="input-label">出生时间</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            className="input-field select-field"
            value={birthHour}
            onChange={(e) => handleInputChange('time', `${e.target.value}:${birthMinute}`)}
          >
            {hours.map(h => (
              <option key={h} value={h}>{h}时</option>
            ))}
          </select>
          <select
            className="input-field select-field"
            value={birthMinute}
            onChange={(e) => handleInputChange('time', `${birthHour}:${e.target.value}`)}
          >
            {minutes.map(m => (
              <option key={m} value={m}>{m}分</option>
            ))}
          </select>
        </div>
      </div>

      <div className="input-group" style={{ position: 'relative' }} ref={dropdownRef}>
        <label className="input-label">
          <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
          出生城市
        </label>
        <input
          ref={inputRef}
          type="text"
          className="input-field"
          placeholder="输入城市名称"
          value={cityQuery}
          onChange={(e) => {
            setCityQuery(e.target.value);
            setShowCityDropdown(true);
          }}
          onFocus={() => setShowCityDropdown(true)}
        />
        {showCityDropdown && cityQuery && (
          <div className="autocomplete-dropdown">
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => (
                <div
                  key={`${city.name}-${city.country}`}
                  className="autocomplete-item"
                  onClick={() => handleCitySelect(city)}
                >
                  {city.name}, {city.country}
                </div>
              ))
            ) : (
              <div className="autocomplete-item" style={{ color: 'var(--color-text-muted)' }}>
                未找到匹配的城市
              </div>
            )}
          </div>
        )}
      </div>

      <div className="input-group">
        <label className="input-label">时区</label>
        <select
          className={`input-field select-field ${!timezoneValid ? 'error' : ''}`}
          value={birthInfo.timezone}
          onChange={(e) => handleInputChange('timezone', e.target.value)}
        >
          {timezones.map(tz => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
        {timezoneValid && (
          <div className="input-validation">
            <Check size={14} />
            时区已验证
          </div>
        )}
      </div>

      <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--color-glass-border)' }}>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
          当前坐标: {birthInfo.latitude.toFixed(4)}°N, {birthInfo.longitude.toFixed(4)}°E
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          时区: {birthInfo.timezone}
        </div>
      </div>
    </div>
  );
};

export default InputPanel;
