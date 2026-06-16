import React, { useEffect, useState } from 'react'
import { useSimulationStore } from '../../store/simulationStore'

export const DataDashboard: React.FC = () => {
  const { displayStats } = useSimulationStore()

  const formatValue = (value: number, decimals = 1) => value.toFixed(decimals)

  const metrics = [
    {
      label: '车辆平均等待时间',
      value: displayStats.avgVehicleWaitTime,
      unit: '秒',
      inverse: true,
      maxValue: 60,
    },
    {
      label: '行人过街平均时间',
      value: displayStats.avgPedestrianCrossTime,
      unit: '秒',
      inverse: true,
      maxValue: 30,
    },
    {
      label: '通行效率评分',
      value: displayStats.efficiencyScore,
      unit: '分',
      inverse: false,
      maxValue: 100,
    },
  ]

  const getProgressWidth = (value: number, maxValue: number, inverse: boolean) => {
    const normalized = Math.min(100, Math.max(0, (value / maxValue) * 100))
    return inverse ? 100 - normalized : normalized
  }

  return (
    <div className="data-dashboard">
      <div className="dashboard-title">交通数据实时监控</div>
      {metrics.map((metric) => (
        <div key={metric.label} className="metric-group">
          <div className="metric-header">
            <span className="metric-label">{metric.label}</span>
            <span className="metric-value">
              {formatValue(metric.value, metric.unit === '分' ? 0 : 1)}
              <span className="metric-unit">{metric.unit}</span>
            </span>
          </div>
          <div className="metric-progress-bar">
            <div
              className="metric-progress-fill"
              style={{
                width: `${getProgressWidth(metric.value, metric.maxValue, metric.inverse)}%`,
              }}
            />
          </div>
        </div>
      ))}
      <div className="dashboard-footer">
        <span>车辆: {displayStats.vehicleCount}</span>
        <span>行人: {displayStats.pedestrianCount}</span>
      </div>
    </div>
  )
}
