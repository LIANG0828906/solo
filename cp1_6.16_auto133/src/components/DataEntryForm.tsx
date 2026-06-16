import React, { useState } from 'react';
import { ZoneId, LightLevel, SoilMoisture, PlantType } from '../types';
import { useStore } from '../store';
import { getPlantName } from '../utils/adviceGenerator';

interface DataEntryFormProps {
  zoneId: ZoneId;
}

const DataEntryForm: React.FC<DataEntryFormProps> = ({ zoneId }) => {
  const { addData, setZonePlant, zones } = useStore();
  const zone = zones[zoneId];

  const [temperature, setTemperature] = useState<string>('22');
  const [humidity, setHumidity] = useState<string>('60');
  const [light, setLight] = useState<LightLevel>('medium');
  const [soilMoisture, setSoilMoisture] = useState<SoilMoisture>('moist');
  const [plant, setPlant] = useState<PlantType>(zone.plant);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const temp = parseFloat(temperature);
    const hum = parseInt(humidity, 10);

    if (isNaN(temp) || temp < -10 || temp > 50) {
      alert('温度必须在-10℃到50℃之间');
      return;
    }

    if (isNaN(hum) || hum < 0 || hum > 100) {
      alert('湿度必须在0%到100%之间');
      return;
    }

    addData(zoneId, {
      temperature: temp,
      humidity: hum,
      light,
      soilMoisture
    });

    setZonePlant(zoneId, plant);
  };

  return (
    <div style={styles.container} className="fade-in">
      <h3 style={styles.title}>记录数据 - {zone.name}</h3>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>温度 (℃)</label>
            <input
              type="number"
              min="-10"
              max="50"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>湿度 (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={humidity}
              onChange={(e) => setHumidity(e.target.value)}
              style={styles.input}
              required
            />
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>光照强度</label>
            <select
              value={light}
              onChange={(e) => setLight(e.target.value as LightLevel)}
              style={styles.select}
            >
              <option value="low">弱光</option>
              <option value="medium">中等</option>
              <option value="high">强光</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>土壤湿度</label>
            <select
              value={soilMoisture}
              onChange={(e) => setSoilMoisture(e.target.value as SoilMoisture)}
              style={styles.select}
            >
              <option value="dry">干燥</option>
              <option value="moist">湿润</option>
              <option value="waterlogged">水涝</option>
            </select>
          </div>
        </div>

        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>种植植物</label>
            <select
              value={plant}
              onChange={(e) => setPlant(e.target.value as PlantType)}
              style={styles.select}
            >
              <option value="pothos">{getPlantName('pothos')}</option>
              <option value="succulent">{getPlantName('succulent')}</option>
              <option value="rose">{getPlantName('rose')}</option>
              <option value="mint">{getPlantName('mint')}</option>
            </select>
          </div>
        </div>

        <button type="submit" style={styles.button}>
          📝 记录数据
        </button>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#2E7D32',
    marginBottom: '16px',
    fontFamily: 'Georgia, serif'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap'
  },
  formGroup: {
    flex: 1,
    minWidth: '150px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#555'
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'Roboto, sans-serif'
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontFamily: 'Roboto, sans-serif'
  },
  button: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    fontFamily: 'Roboto, sans-serif',
    alignSelf: 'flex-start'
  }
};

export default DataEntryForm;
