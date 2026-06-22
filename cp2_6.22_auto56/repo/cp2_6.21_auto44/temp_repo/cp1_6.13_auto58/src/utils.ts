import { v4 as uuidv4 } from 'uuid';
import type { ComponentConfig, ComponentType } from './types';

export function generateUUID(): string {
  return uuidv4();
}

export function convertComponentsToHTML(components: ComponentConfig[]): string {
  const componentHTML = components.map(comp => {
    const baseStyle = `margin:0;padding:0;box-sizing:border-box;position:absolute;left:${comp.x}px;top:${comp.y}px;width:${comp.width}px;height:${comp.height}px;background-color:${comp.backgroundColor || 'transparent'};border-radius:${comp.borderRadius || 0}px;overflow:hidden;`;

    switch (comp.type) {
      case 'title':
        return `<div style="${baseStyle}"><h1 style="margin:0;padding:8px;box-sizing:border-box;font-size:${comp.fontSize || 24}px;color:${comp.color || '#1e3a5f'};width:100%;height:100%;display:flex;align-items:center;">${comp.content || '标题文本'}</h1></div>`;
      case 'paragraph':
        return `<div style="${baseStyle}"><p style="margin:0;padding:8px;box-sizing:border-box;font-size:${comp.fontSize || 14}px;color:${comp.color || '#333333'};width:100%;height:100%;overflow:hidden;line-height:1.6;">${comp.content || '段落文本内容'}</p></div>`;
      case 'image':
        return `<div style="${baseStyle}"><img src="${comp.images?.[0] || 'https://via.placeholder.com/400x300'}" style="margin:0;padding:0;box-sizing:border-box;width:100%;height:100%;object-fit:cover;display:block;" alt="图片" /></div>`;
      case 'button':
        return `<div style="${baseStyle}display:flex;align-items:center;justify-content:center;"><button style="margin:0;padding:0 16px;box-sizing:border-box;width:100%;height:100%;background-color:#2196F3;color:#ffffff;border:none;border-radius:4px;font-size:${comp.fontSize || 14}px;cursor:pointer;">${comp.content || '按钮'}</button></div>`;
      case 'form':
        return `<div style="${baseStyle}"><div style="margin:0;padding:12px;box-sizing:border-box;width:100%;height:100%;"><input placeholder="输入框" style="margin:0 0 8px 0;padding:8px;box-sizing:border-box;width:100%;border:1px solid #ddd;border-radius:4px;font-size:14px;" /><input placeholder="输入框" style="margin:0 0 8px 0;padding:8px;box-sizing:border-box;width:100%;border:1px solid #ddd;border-radius:4px;font-size:14px;" /><button style="margin:0;padding:8px 16px;box-sizing:border-box;background-color:#2196F3;color:#fff;border:none;border-radius:4px;cursor:pointer;">提交</button></div></div>`;
      case 'carousel':
        return `<div style="${baseStyle}"><div style="margin:0;padding:0;box-sizing:border-box;width:100%;height:100%;position:relative;overflow:hidden;background-color:#f0f0f0;"><div style="margin:0;padding:0;box-sizing:border-box;width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#999;">轮播图组件</div></div></div>`;
      default:
        return `<div style="${baseStyle}">${comp.content || ''}</div>`;
    }
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>FlexPage 导出页面</title>
<style>* { margin: 0; padding: 0; box-sizing: border-box; } body { position: relative; width: 1200px; height: 800px; margin: 0 auto; }</style>
</head>
<body>
${componentHTML}
</body>
</html>`;
}
