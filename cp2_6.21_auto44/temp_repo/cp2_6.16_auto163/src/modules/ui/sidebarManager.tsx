import React from 'react'
import { useUIStore } from '../../store/uiStore'
import { useCrossroadSignalStore } from '../../store/crossroadSignalStore'
import { PRESET_MODULES } from '../../types'

export const SidebarManager: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, requestPresetActivation, showConfirmModal, pendingPreset, confirmPresetActivation, cancelPresetActivation } = useUIStore()
  const { applyPreset } = useCrossroadSignalStore()

  const handleConfirm = () => {
    if (pendingPreset) {
      applyPreset(pendingPreset.id)
      confirmPresetActivation()
    }
  }

  return (
    <>
      <button className="hamburger-btn" onClick={toggleSidebar}>
        <span />
        <span />
        <span />
      </button>

      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>模组管理器</h2>
        </div>
        <div className="preset-list">
          {PRESET_MODULES.map((preset) => (
            <div key={preset.id} className="preset-card">
              <div className="preset-name">{preset.name}</div>
              <div className="preset-description">{preset.description}</div>
              <div className="preset-config">
                <span style={{ color: '#FF0055' }}>红 {preset.signalConfig.redDuration}s</span>
                <span style={{ color: '#FFAA00' }}>黄 {preset.signalConfig.yellowDuration}s</span>
                <span style={{ color: '#00FFAA' }}>绿 {preset.signalConfig.greenDuration}s</span>
              </div>
              <button className="preset-activate-btn" onClick={() => requestPresetActivation(preset.id)}>
                激活模组
              </button>
            </div>
          ))}
        </div>
      </div>

      {showConfirmModal && pendingPreset && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>确认激活模组</h3>
            <p className="modal-text">
              即将激活「<span className="modal-highlight">{pendingPreset.name}</span>」，
              所有路口信号灯将重置为该模组的参数。
            </p>
            <p className="modal-config">
              红灯 {pendingPreset.signalConfig.redDuration}秒 / 
              黄灯 {pendingPreset.signalConfig.yellowDuration}秒 / 
              绿灯 {pendingPreset.signalConfig.greenDuration}秒
            </p>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={cancelPresetActivation}>
                取消
              </button>
              <button className="modal-btn confirm" onClick={handleConfirm}>
                确认激活
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
