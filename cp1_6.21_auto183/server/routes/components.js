const express = require('express');
const router = express.Router();

const components = [
  {
    id: 'btn-primary',
    name: '主要按钮',
    category: '按钮',
    description: '主要操作按钮，用于页面核心交互动作',
    code: `<button class="btn-primary">点击我</button>

<style>
.btn-primary {
  background: #3B82F6;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-primary:hover {
  opacity: 0.85;
}
</style>`,
    previewTemplate: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;height:100vh;background:#0F172A;font-family:sans-serif}button{background:{{bgColor}};color:#fff;border:none;border-radius:{{borderRadius}}px;padding:{{paddingY}}px {{paddingX}}px;font-size:{{fontSize}}px;cursor:pointer;transition:opacity .2s;{{^enabled}}opacity:.5;pointer-events:none;{{/enabled}}}button:hover{opacity:.85}</style></head><body><button>{{label}}</button></body></html>`,
    properties: [
      { name: 'label', label: '按钮文本', type: 'slider', min: 0, max: 1, step: 1, defaultValue: 0, options: ['点击我', '提交', '确认'] },
      { name: 'bgColor', label: '背景颜色', type: 'color', defaultValue: '#3B82F6' },
      { name: 'borderRadius', label: '圆角', type: 'slider', min: 0, max: 24, step: 1, defaultValue: 8 },
      { name: 'fontSize', label: '字号', type: 'slider', min: 12, max: 24, step: 1, defaultValue: 16 },
      { name: 'paddingX', label: '水平内边距', type: 'slider', min: 8, max: 48, step: 2, defaultValue: 24 },
      { name: 'paddingY', label: '垂直内边距', type: 'slider', min: 4, max: 24, step: 2, defaultValue: 12 },
      { name: 'enabled', label: '启用状态', type: 'toggle', defaultValue: true }
    ]
  },
  {
    id: 'btn-gradient',
    name: '渐变按钮',
    category: '按钮',
    description: '带渐变效果的按钮，适用于视觉吸引力较强的操作',
    code: `<button class="btn-gradient">开始体验</button>

<style>
.btn-gradient {
  background: linear-gradient(135deg, #6366F1, #EC4899);
  color: #fff;
  border: none;
  border-radius: 24px;
  padding: 12px 32px;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s;
}
.btn-gradient:hover {
  transform: scale(1.05);
}
</style>`,
    previewTemplate: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;height:100vh;background:#0F172A;font-family:sans-serif}button{background:linear-gradient(135deg,{{colorStart}},{{colorEnd}});color:#fff;border:none;border-radius:{{borderRadius}}px;padding:{{paddingY}}px {{paddingX}}px;font-size:{{fontSize}}px;cursor:pointer;transition:transform .2s}button:hover{transform:scale(1.05)}</style></head><body><button>开始体验</button></body></html>`,
    properties: [
      { name: 'colorStart', label: '起始颜色', type: 'color', defaultValue: '#6366F1' },
      { name: 'colorEnd', label: '结束颜色', type: 'color', defaultValue: '#EC4899' },
      { name: 'borderRadius', label: '圆角', type: 'slider', min: 0, max: 32, step: 1, defaultValue: 24 },
      { name: 'fontSize', label: '字号', type: 'slider', min: 12, max: 24, step: 1, defaultValue: 16 },
      { name: 'paddingX', label: '水平内边距', type: 'slider', min: 8, max: 48, step: 2, defaultValue: 32 },
      { name: 'paddingY', label: '垂直内边距', type: 'slider', min: 4, max: 24, step: 2, defaultValue: 12 }
    ]
  },
  {
    id: 'btn-outline',
    name: '描边按钮',
    category: '按钮',
    description: '描边样式按钮，适用于次要操作场景',
    code: `<button class="btn-outline">取消</button>

<style>
.btn-outline {
  background: transparent;
  color: #3B82F6;
  border: 2px solid #3B82F6;
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-outline:hover {
  background: #3B82F6;
  color: #fff;
}
</style>`,
    previewTemplate: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;height:100vh;background:#0F172A;font-family:sans-serif}button{background:transparent;color:{{borderColor}};border:2px solid {{borderColor}};border-radius:{{borderRadius}}px;padding:{{paddingY}}px {{paddingX}}px;font-size:{{fontSize}}px;cursor:pointer;transition:all .2s;{{^enabled}}opacity:.5;pointer-events:none;{{/enabled}}}button:hover{background:{{borderColor}};color:#fff}</style></head><body><button>取消</button></body></html>`,
    properties: [
      { name: 'borderColor', label: '边框颜色', type: 'color', defaultValue: '#3B82F6' },
      { name: 'borderRadius', label: '圆角', type: 'slider', min: 0, max: 24, step: 1, defaultValue: 8 },
      { name: 'fontSize', label: '字号', type: 'slider', min: 12, max: 24, step: 1, defaultValue: 16 },
      { name: 'paddingX', label: '水平内边距', type: 'slider', min: 8, max: 48, step: 2, defaultValue: 24 },
      { name: 'paddingY', label: '垂直内边距', type: 'slider', min: 4, max: 24, step: 2, defaultValue: 10 },
      { name: 'enabled', label: '启用状态', type: 'toggle', defaultValue: true }
    ]
  },
  {
    id: 'input-search',
    name: '搜索输入框',
    category: '输入框',
    description: '带搜索图标的输入框，用于搜索场景',
    code: `<div class="search-box">
  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
  <input type="text" placeholder="搜索组件..." />
</div>

<style>
.search-box {
  position: relative;
  display: inline-block;
}
.search-box .icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #64748B;
}
.search-box input {
  padding: 10px 16px 10px 40px;
  border: 1px solid #334155;
  border-radius: 8px;
  background: #1E293B;
  color: #F8FAFC;
  font-size: 14px;
  outline: none;
  width: 280px;
  transition: border-color 0.2s;
}
.search-box input:focus {
  border-color: #3B82F6;
}
</style>`,
    previewTemplate: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;height:100vh;background:#0F172A;font-family:sans-serif}.box{position:relative;display:inline-block}.icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:18px;height:18px;color:#64748B}input{padding:10px 16px 10px 40px;border:1px solid {{borderColor}};border-radius:{{borderRadius}}px;background:#1E293B;color:#F8FAFC;font-size:{{fontSize}}px;outline:none;width:280px;transition:border-color .2s}input:focus{border-color:{{focusBorder}}}</style></head><body><div class="box"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input type="text" placeholder="搜索组件..." /></div></body></html>`,
    properties: [
      { name: 'borderColor', label: '边框颜色', type: 'color', defaultValue: '#334155' },
      { name: 'borderRadius', label: '圆角', type: 'slider', min: 0, max: 24, step: 1, defaultValue: 8 },
      { name: 'focusBorder', label: '聚焦边框', type: 'color', defaultValue: '#3B82F6' },
      { name: 'fontSize', label: '字号', type: 'slider', min: 12, max: 20, step: 1, defaultValue: 14 }
    ]
  },
  {
    id: 'input-text',
    name: '文本输入框',
    category: '输入框',
    description: '标准文本输入框，支持标签和聚焦效果',
    code: `<div class="text-input">
  <label>用户名</label>
  <input type="text" placeholder="请输入用户名" />
</div>

<style>
.text-input label {
  display: block;
  margin-bottom: 6px;
  color: #94A3B8;
  font-size: 14px;
}
.text-input input {
  padding: 10px 16px;
  border: 1px solid #334155;
  border-radius: 6px;
  background: #1E293B;
  color: #F8FAFC;
  font-size: 14px;
  outline: none;
  width: 260px;
  transition: border-color 0.2s;
}
.text-input input:focus {
  border-color: #3B82F6;
}
</style>`,
    previewTemplate: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;height:100vh;background:#0F172A;font-family:sans-serif}.wrap{width:280px}label{display:block;margin-bottom:6px;color:#94A3B8;font-size:{{fontSize}}px;{{^showLabel}}display:none;{{/showLabel}}}input{padding:10px 16px;border:1px solid {{borderColor}};border-radius:{{borderRadius}}px;background:#1E293B;color:#F8FAFC;font-size:{{fontSize}}px;outline:none;width:100%;transition:border-color .2s}input:focus{border-color:#3B82F6}</style></head><body><div class="wrap"><label>用户名</label><input type="text" placeholder="请输入用户名" /></div></body></html>`,
    properties: [
      { name: 'borderColor', label: '边框颜色', type: 'color', defaultValue: '#334155' },
      { name: 'borderRadius', label: '圆角', type: 'slider', min: 0, max: 16, step: 1, defaultValue: 6 },
      { name: 'fontSize', label: '字号', type: 'slider', min: 12, max: 20, step: 1, defaultValue: 14 },
      { name: 'showLabel', label: '显示标签', type: 'toggle', defaultValue: true }
    ]
  },
  {
    id: 'input-password',
    name: '密码输入框',
    category: '输入框',
    description: '带可见性切换的密码输入框',
    code: `<div class="password-input">
  <input type="password" placeholder="请输入密码" />
  <button class="toggle">👁</button>
</div>

<style>
.password-input {
  position: relative;
  display: inline-block;
}
.password-input input {
  padding: 10px 40px 10px 16px;
  border: 1px solid #334155;
  border-radius: 8px;
  background: #1E293B;
  color: #F8FAFC;
  font-size: 14px;
  outline: none;
  width: 260px;
  transition: border-color 0.2s;
}
.password-input input:focus {
  border-color: #3B82F6;
}
.toggle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
}
</style>`,
    previewTemplate: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;height:100vh;background:#0F172A;font-family:sans-serif}.wrap{position:relative;display:inline-block}input{padding:10px 40px 10px 16px;border:1px solid {{borderColor}};border-radius:{{borderRadius}}px;background:#1E293B;color:#F8FAFC;font-size:{{fontSize}}px;outline:none;width:260px;transition:border-color .2s}input:focus{border-color:#3B82F6}.toggle{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;{{^showToggle}}display:none;{{/showToggle}}}</style></head><body><div class="wrap"><input type="password" placeholder="请输入密码" /><button class="toggle">&#128065;</button></div></body></html>`,
    properties: [
      { name: 'borderColor', label: '边框颜色', type: 'color', defaultValue: '#334155' },
      { name: 'borderRadius', label: '圆角', type: 'slider', min: 0, max: 24, step: 1, defaultValue: 8 },
      { name: 'fontSize', label: '字号', type: 'slider', min: 12, max: 20, step: 1, defaultValue: 14 },
      { name: 'showToggle', label: '显示切换', type: 'toggle', defaultValue: true }
    ]
  },
  {
    id: 'card-profile',
    name: '用户卡片',
    category: '卡片',
    description: '展示用户头像、姓名和角色的信息卡片',
    code: `<div class="profile-card">
  <div class="avatar">Z</div>
  <div class="info">
    <h3>张三</h3>
    <p>前端工程师</p>
  </div>
</div>

<style>
.profile-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #1E293B;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #3B82F6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 20px;
}
.info h3 { color: #F8FAFC; margin: 0; }
.info p { color: #94A3B8; margin: 4px 0 0; }
</style>`,
    previewTemplate: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;height:100vh;background:#0F172A;font-family:sans-serif}.card{display:flex;align-items:center;gap:16px;padding:20px;background:{{bgColor}};border-radius:{{borderRadius}}px;box-shadow:0 2px 8px rgba(0,0,0,.3);width:280px}.avatar{width:48px;height:48px;border-radius:50%;background:#3B82F6;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:20px;{{^showAvatar}}display:none;{{/showAvatar}}}h3{color:#F8FAFC;margin:0;font-size:{{fontSize}}px}p{color:#94A3B8;margin:4px 0 0;font-size:{{fontSize}}px}</style></head><body><div class="card"><div class="avatar">Z</div><div><h3>张三</h3><p>前端工程师</p></div></div></body></html>`,
    properties: [
      { name: 'bgColor', label: '背景颜色', type: 'color', defaultValue: '#1E293B' },
      { name: 'borderRadius', label: '圆角', type: 'slider', min: 0, max: 24, step: 1, defaultValue: 12 },
      { name: 'fontSize', label: '字号', type: 'slider', min: 12, max: 20, step: 1, defaultValue: 14 },
      { name: 'showAvatar', label: '显示头像', type: 'toggle', defaultValue: true }
    ]
  },
  {
    id: 'card-stats',
    name: '统计卡片',
    category: '卡片',
    description: '展示关键数值和趋势的统计卡片',
    code: `<div class="stats-card">
  <div class="label">总用户数</div>
  <div class="value">12,847</div>
  <div class="trend">+12.5%</div>
</div>

<style>
.stats-card {
  padding: 24px;
  background: #1E293B;
  border-radius: 12px;
  border-left: 4px solid #3B82F6;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.label { color: #94A3B8; font-size: 14px; }
.value { color: #F8FAFC; font-size: 32px; font-weight: bold; margin: 8px 0; }
.trend { color: #22C55E; font-size: 14px; }
</style>`,
    previewTemplate: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;height:100vh;background:#0F172A;font-family:sans-serif}.card{padding:24px;background:{{bgColor}};border-radius:{{borderRadius}}px;border-left:4px solid {{accentColor}};box-shadow:0 2px 8px rgba(0,0,0,.3);width:240px}.label{color:#94A3B8;font-size:14px}.value{color:#F8FAFC;font-size:{{fontSize}}px;font-weight:bold;margin:8px 0}.trend{color:#22C55E;font-size:14px}</style></head><body><div class="card"><div class="label">总用户数</div><div class="value">12,847</div><div class="trend">+12.5%</div></div></body></html>`,
    properties: [
      { name: 'bgColor', label: '背景颜色', type: 'color', defaultValue: '#1E293B' },
      { name: 'borderRadius', label: '圆角', type: 'slider', min: 0, max: 24, step: 1, defaultValue: 12 },
      { name: 'accentColor', label: '强调色', type: 'color', defaultValue: '#3B82F6' },
      { name: 'fontSize', label: '数值字号', type: 'slider', min: 20, max: 48, step: 2, defaultValue: 32 }
    ]
  },
  {
    id: 'nav-breadcrumb',
    name: '面包屑导航',
    category: '导航',
    description: '层级式路径导航，展示当前页面位置',
    code: `<nav class="breadcrumb">
  <a href="#">首页</a>
  <span class="sep">/</span>
  <a href="#">组件库</a>
  <span class="sep">/</span>
  <span class="current">按钮</span>
</nav>

<style>
.breadcrumb { display: flex; align-items: center; gap: 8px; }
.breadcrumb a { color: #94A3B8; text-decoration: none; font-size: 14px; }
.breadcrumb a:hover { color: #F59E0B; }
.breadcrumb .sep { color: #64748B; }
.breadcrumb .current { color: #F8FAFC; font-size: 14px; }
</style>`,
    previewTemplate: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;height:100vh;background:#0F172A;font-family:sans-serif}nav{display:flex;align-items:center;gap:8px}a{color:#94A3B8;text-decoration:none;font-size:{{fontSize}}px}a:hover{color:{{activeColor}}}.sep{color:{{separatorColor}}}.current{color:#F8FAFC;font-size:{{fontSize}}px}</style></head><body><nav><a href="#">首页</a><span class="sep">/</span><a href="#">组件库</a><span class="sep">/</span><span class="current">按钮</span></nav></body></html>`,
    properties: [
      { name: 'separatorColor', label: '分隔符颜色', type: 'color', defaultValue: '#64748B' },
      { name: 'activeColor', label: '激活颜色', type: 'color', defaultValue: '#F59E0B' },
      { name: 'fontSize', label: '字号', type: 'slider', min: 12, max: 20, step: 1, defaultValue: 14 }
    ]
  },
  {
    id: 'nav-tabs',
    name: '标签导航',
    category: '导航',
    description: '水平标签式导航，适用于内容分组切换',
    code: `<div class="tabs">
  <button class="tab active">概览</button>
  <button class="tab">文档</button>
  <button class="tab">示例</button>
</div>

<style>
.tabs { display: flex; gap: 4px; }
.tab {
  padding: 8px 20px;
  border: none;
  background: transparent;
  color: #94A3B8;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}
.tab.active {
  background: #3B82F6;
  color: #fff;
}
.tab:hover:not(.active) {
  color: #F8FAFC;
}
</style>`,
    previewTemplate: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;height:100vh;background:#0F172A;font-family:sans-serif}.tabs{display:flex;gap:4px;background:#1E293B;border-radius:{{borderRadius}}px;padding:4px}.tab{padding:8px 20px;border:none;background:transparent;color:#94A3B8;font-size:{{fontSize}}px;cursor:pointer;border-radius:{{borderRadius}}px;transition:all .2s}.tab.active{background:{{activeColor}};color:#fff}.tab:hover:not(.active){color:#F8FAFC}</style></head><body><div class="tabs"><button class="tab active">概览</button><button class="tab">文档</button><button class="tab">示例</button></div></body></html>`,
    properties: [
      { name: 'activeColor', label: '激活颜色', type: 'color', defaultValue: '#3B82F6' },
      { name: 'borderRadius', label: '圆角', type: 'slider', min: 0, max: 16, step: 1, defaultValue: 8 },
      { name: 'fontSize', label: '字号', type: 'slider', min: 12, max: 20, step: 1, defaultValue: 14 }
    ]
  },
  {
    id: 'feedback-alert',
    name: '警告提示',
    category: '反馈',
    description: '用于向用户显示重要信息的警告提示组件',
    code: `<div class="alert alert-success">
  <span class="icon">✓</span>
  <span class="msg">操作成功完成</span>
</div>

<style>
.alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
}
.alert-success {
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.3);
  color: #22C55E;
}
.alert-warning {
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.3);
  color: #F59E0B;
}
.alert-error {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  color: #EF4444;
}
</style>`,
    previewTemplate: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;height:100vh;background:#0F172A;font-family:sans-serif}.alert{display:flex;align-items:center;gap:12px;padding:12px 20px;border-radius:{{borderRadius}}px;font-size:{{fontSize}}px;width:280px}.icon{font-size:18px;{{^showIcon}}display:none;{{/showIcon}}}.s{background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);color:#22C55E}.w{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);color:#F59E0B}.e{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#EF4444}</style></head><body><div class="alert {{typeClass}}"><span class="icon">{{icon}}</span><span>{{message}}</span></div></body></html>`,
    properties: [
      { name: 'typeClass', label: '类型', type: 'slider', min: 0, max: 2, step: 1, defaultValue: 0, options: ['s', 'w', 'e'] },
      { name: 'icon', label: '图标', type: 'slider', min: 0, max: 2, step: 1, defaultValue: 0, options: ['✓', '⚠', '✕'] },
      { name: 'message', label: '消息', type: 'slider', min: 0, max: 2, step: 1, defaultValue: 0, options: ['操作成功完成', '请注意检查输入', '操作失败请重试'] },
      { name: 'borderRadius', label: '圆角', type: 'slider', min: 0, max: 16, step: 1, defaultValue: 8 },
      { name: 'fontSize', label: '字号', type: 'slider', min: 12, max: 20, step: 1, defaultValue: 14 },
      { name: 'showIcon', label: '显示图标', type: 'toggle', defaultValue: true }
    ]
  },
  {
    id: 'feedback-spinner',
    name: '加载指示器',
    category: '反馈',
    description: '旋转加载指示器，用于异步操作等待反馈',
    code: `<div class="spinner-wrap">
  <div class="spinner"></div>
  <span>加载中...</span>
</div>

<style>
.spinner-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #334155;
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
span { color: #94A3B8; font-size: 14px; }
</style>`,
    previewTemplate: `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;height:100vh;background:#0F172A;font-family:sans-serif}.wrap{display:flex;flex-direction:column;align-items:center;gap:12px}.spinner{width:{{size}}px;height:{{size}}px;border:3px solid #334155;border-top-color:{{spinnerColor}};border-radius:50%;animation:spin {{speed}}s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}span{color:#94A3B8;font-size:14px;{{^showText}}display:none;{{/showText}}}</style></head><body><div class="wrap"><div class="spinner"></div><span>加载中...</span></div></body></html>`,
    properties: [
      { name: 'spinnerColor', label: '旋转颜色', type: 'color', defaultValue: '#3B82F6' },
      { name: 'size', label: '尺寸', type: 'slider', min: 20, max: 64, step: 4, defaultValue: 40 },
      { name: 'speed', label: '速度', type: 'slider', min: 5, max: 30, step: 1, defaultValue: 10 },
      { name: 'showText', label: '显示文本', type: 'toggle', defaultValue: true }
    ]
  }
];

router.get('/', (req, res) => {
  const { category } = req.query;
  if (category && category !== '全部') {
    return res.json(components.filter(c => c.category === category));
  }
  res.json(components);
});

router.get('/:id', (req, res) => {
  const component = components.find(c => c.id === req.params.id);
  if (component) {
    res.json(component);
  } else {
    res.status(404).json({ error: 'Component not found' });
  }
});

module.exports = router;
