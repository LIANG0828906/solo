import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { FigureData, ColorLayer } from '@/types';
import { mineralPalette } from '@/constants/colorPalette';
import { stepNames } from '@/constants/poseList';

export const captureScreenshot = (
  canvas: HTMLCanvasElement,
  width: number = 800
): Promise<string> => {
  return new Promise((resolve) => {
    const tempCanvas = document.createElement('canvas');
    const scale = width / canvas.width;
    tempCanvas.width = width;
    tempCanvas.height = canvas.height * scale;
    
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#2c1e14';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
      resolve(tempCanvas.toDataURL('image/png'));
    } else {
      resolve(canvas.toDataURL('image/png'));
    }
  });
};

export const getColorName = (hex: string): string => {
  const match = mineralPalette.find((c) => c.value.toLowerCase() === hex.toLowerCase());
  return match ? match.name : hex;
};

export const generateDescription = (
  figureData: FigureData,
  figureName: string,
  creatorName: string
): string => {
  const { pose, baseColor, colorLayers, goldLeaf, currentStep } = figureData;
  
  const completedSteps = stepNames.slice(0, currentStep + 1);
  const pigments = [getColorName(baseColor), ...colorLayers.map((l) => getColorName(l.color))];
  
  const goldPositions = goldLeaf.positions.map((p) => {
    const map: Record<string, string> = {
      halo: '头光',
      edge: '衣缘',
      ribbon: '飘带',
    };
    return map[p] || p;
  });

  return `【作品名称】${figureName}
【创作者】${creatorName}
【创作日期】${new Date().toLocaleDateString('zh-CN')}

【神像姿态】${pose.name}
${pose.description}

【形态参数】
· 头身比：1:${pose.headRatio.toFixed(1)}
· 肩宽系数：${pose.shoulderRatio.toFixed(2)}
· 腰身曲线：${(pose.waistCurve * 100).toFixed(0)}%

【颜料清单】
${pigments.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}

【装饰纹样】
${colorLayers
  .filter((l) => l.type === 'pattern')
  .map((l: ColorLayer) => {
    const patternNames: Record<string, string> = {
      scroll: '卷草纹',
      cloud: '云纹',
      flame: '火焰纹',
    };
    return `  · ${patternNames[l.patternType || ''] || l.name}`;
  })
  .join('\n') || '  暂无纹样装饰'}

【贴金装饰】
· 贴金面积：${goldLeaf.area}%
· 贴金位置：${goldPositions.length > 0 ? goldPositions.join('、') : '无'}

【完成工序】
${completedSteps.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}

【作品简介】
此像采用宋代泥塑工艺，经七道工序精心制作而成。
匠人心存恭敬，手不释泥，终成一尊庄严宝相。
愿见者欢喜，心生善念。

—— 宋代泥塑作坊`;
};

export const saveAsZip = async (
  screenshotDataUrl: string,
  description: string,
  figureName: string
): Promise<void> => {
  const zip = new JSZip();
  
  const imageData = screenshotDataUrl.split(',')[1];
  zip.file(`${figureName}.png`, imageData, { base64: true });
  zip.file(`${figureName}_创作说明.txt`, description);
  
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${figureName}.zip`);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
};

export const generateShareLink = (
  figureName: string,
  creatorName: string
): string => {
  const params = new URLSearchParams({
    name: figureName,
    creator: creatorName,
    t: Date.now().toString(),
  });
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
};
