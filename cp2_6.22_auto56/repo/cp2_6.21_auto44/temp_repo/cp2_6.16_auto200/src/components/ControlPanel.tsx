import React from 'react'
import { useBannerStore } from '../store'
import { TEMPLATES, BANNER_SIZES } from '../templates'
import type { UserInput } from '../types'

const ControlPanel: React.FC = () => {
  const {
    selectedTemplateId,
    selectedSizeId,
    userInput,
    setSelectedTemplateId,
    setSelectedSizeId,
    setUserInput,
  } = useBannerStore()

  const handleInputChange = (field: keyof UserInput, value: string, maxLength: number) => {
    if (value.length <= maxLength) {
      setUserInput({ [field]: value } as Partial<UserInput>)
    }
  }

  return (
    <div className="control-panel">
      <div className="panel-header">
        <h1 className="panel-title">BannerForge</h1>
        <p className="panel-subtitle">快速生成多平台营销横幅</p>
      </div>

      <div className="panel-section">
        <div className="section-header">
          <span className="section-tag">模板选择</span>
        </div>
        <select
          className="template-select"
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
        >
          {TEMPLATES.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        <div className="template-preview">
          {TEMPLATES.map((template) => (
            <div
              key={template.id}
              className={`template-card ${selectedTemplateId === template.id ? 'active' : ''}`}
              onClick={() => setSelectedTemplateId(template.id)}
            >
              <div
                className="template-color"
                style={{
                  background: `linear-gradient(135deg, ${template.background.start}, ${template.background.end})`,
                }}
              />
              <span className="template-name" style={{ color: template.accentColor }}>
                {template.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <div className="section-header">
          <span className="section-tag">内容编辑</span>
        </div>

        <div className="input-group">
          <label className="input-label">商品图片URL</label>
          <input
            type="text"
            className="text-input"
            placeholder="请输入图片URL..."
            value={userInput.imageUrl}
            onChange={(e) => handleInputChange('imageUrl', e.target.value, 500)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            标题 <span className="char-count">{userInput.title.length}/20</span>
          </label>
          <input
            type="text"
            className="text-input"
            placeholder="请输入标题..."
            value={userInput.title}
            onChange={(e) => handleInputChange('title', e.target.value, 20)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            副标题 <span className="char-count">{userInput.subtitle.length}/30</span>
          </label>
          <input
            type="text"
            className="text-input"
            placeholder="请输入副标题..."
            value={userInput.subtitle}
            onChange={(e) => handleInputChange('subtitle', e.target.value, 30)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            按钮文案 <span className="char-count">{userInput.buttonText.length}/10</span>
          </label>
          <input
            type="text"
            className="text-input"
            placeholder="请输入按钮文案..."
            value={userInput.buttonText}
            onChange={(e) => handleInputChange('buttonText', e.target.value, 10)}
          />
        </div>
      </div>

      <div className="panel-section">
        <div className="section-header">
          <span className="section-tag">尺寸选择</span>
        </div>
        <div className="size-group">
          {BANNER_SIZES.map((size) => (
            <button
              key={size.id}
              className={`size-btn ${selectedSizeId === size.id ? 'active' : ''}`}
              onClick={() => setSelectedSizeId(size.id)}
            >
              <span className="size-name">{size.name}</span>
              <span className="size-dimension">
                {size.width} × {size.height}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ControlPanel
