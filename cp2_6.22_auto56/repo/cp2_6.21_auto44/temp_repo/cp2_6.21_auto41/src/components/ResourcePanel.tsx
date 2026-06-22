import React, { useMemo } from 'react';
import {
  useResources,
  useResourceHistory
} from '../store/gameStore';
import { Resources, RESOURCE_COLORS, RESOURCE_NAMES } from '../types/gameTypes';
import { getResourceTrend } from '../core/resourceEngine';
import { useAnimatedNumber } from '../hooks/useAnimation';
import './ResourcePanel.css';

const ResourcePanel: React.FC = () => {
  const resources = useResources();
  const history = useResourceHistory();

  const animatedValues = {
    population: useAnimatedNumber(resources.population),
    money: useAnimatedNumber(resources.money),
    happiness: useAnimatedNumber(resources.happiness),
    environment: useAnimatedNumber(resources.environment)
  };

  const trends = useMemo(() => ({
    population: getResourceTrend(history, 'population'),
    money: getResourceTrend(history, 'money'),
    happiness: getResourceTrend(history, 'happiness'),
    environment: getResourceTrend(history, 'environment')
  }), [history]);

  const resourceKeys: (keyof Resources)[] = ['population', 'money', 'happiness', 'environment'];

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  };

  const getTrendClass = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'trend-up';
      case 'down': return 'trend-down';
      default: return 'trend-stable';
    }
  };

  const getResourceIcon = (key: keyof Resources) => {
    switch (key) {
      case 'population': return '👥';
      case 'money': return '💰';
      case 'happiness': return '😊';
      case 'environment': return '🌿';
    }
  };

  return (
    <div className="resource-panel">
      {resourceKeys.map(key => (
        <div
          key={key}
          className="resource-item"
          style={{
            borderLeftColor: RESOURCE_COLORS[key]
          }}
        >
          <div className="resource-icon">
            {getResourceIcon(key)}
          </div>
          <div className="resource-info">
            <div className="resource-name">
              {RESOURCE_NAMES[key]}
            </div>
            <div className="resource-value-row">
              <span 
                className="resource-value"
                style={{ color: RESOURCE_COLORS[key] }}
              >
                {key === 'environment' || key === 'happiness' 
                  ? `${animatedValues[key]}%`
                  : animatedValues[key]
                }
              </span>
              <span className={`resource-trend ${getTrendClass(trends[key])}`}>
                {getTrendIcon(trends[key])}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResourcePanel;
