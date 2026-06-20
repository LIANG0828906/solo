import jsPDF from 'jspdf';
import { templates } from '../data/templates';

const chineseNumbers = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const units = ['', '拾', '佰', '仟', '万'];

function numberToChinese(num: number): string {
  if (num === 0) return '零';
  if (num >= 10000) {
    const wan = Math.floor(num / 10000);
    const rest = num % 10000;
    return numberToChinese(wan) + '万' + (rest > 0 ? numberToChinese(rest) : '');
  }
  let result = '';
  const str = num.toString();
  for (let i = 0; i < str.length; i++) {
    const digit = parseInt(str[i]);
    const unitIndex = str.length - 1 - i;
    if (digit !== 0) {
      result += chineseNumbers[digit] + units[unitIndex];
    } else if (result && result[result.length - 1] !== '零') {
      result += '零';
    }
  }
  return result.replace(/零+$/, '');
}

function amountToChinese(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return '';
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);
  let result = numberToChinese(integerPart) + '元';
  if (decimalPart > 0) {
    const jiao = Math.floor(decimalPart / 10);
    const fen = decimalPart % 10;
    if (jiao > 0) result += chineseNumbers[jiao] + '角';
    if (fen > 0) result += chineseNumbers[fen] + '分';
  } else {
    result += '整';
  }
  return result;
}

export function generatePDF(templateId: string, variables: Record<string, string>): jsPDF {
  const template = templates.find(t => t.id === templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  const doc = new jsPDF();
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  const processedVariables: Record<string, string> = { ...variables };
  
  for (const [key, value] of Object.entries(variables)) {
    if ((key === 'amount' || key === 'serviceFee' || key === 'penaltyAmount') && value) {
      processedVariables[`${key}Chinese`] = amountToChinese(value);
    }
  }

  template.content.forEach((line, index) => {
    let processedLine = line;
    for (const [key, value] of Object.entries(processedVariables)) {
      processedLine = processedLine.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    }

    if (index === 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      const textWidth = doc.getTextWidth(processedLine);
      const xPosition = (pageWidth - textWidth) / 2;
      doc.text(processedLine, xPosition, yPosition);
      yPosition += 15;
    } else if (processedLine === '') {
      yPosition += 8;
    } else if (processedLine.match(/^[一二三四五六七八九十]+、/)) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      const splitText = doc.splitTextToSize(processedLine, contentWidth);
      splitText.forEach((text: string) => {
        doc.text(text, margin, yPosition);
        yPosition += 7 * 1.5;
      });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      const splitText = doc.splitTextToSize(processedLine, contentWidth);
      splitText.forEach((text: string) => {
        doc.text(text, margin, yPosition);
        yPosition += 7 * 1.5;
      });
    }

    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
  });

  return doc;
}

export function generatePDFBase64(templateId: string, variables: Record<string, string>): string {
  const doc = generatePDF(templateId, variables);
  return doc.output('datauristring');
}

export function downloadPDF(templateId: string, variables: Record<string, string>, filename: string): void {
  const doc = generatePDF(templateId, variables);
  doc.save(filename);
}

export function generateHTMLPreview(templateId: string, variables: Record<string, string>): string {
  const template = templates.find(t => t.id === templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  const processedVariables: Record<string, string> = { ...variables };
  
  for (const [key, value] of Object.entries(variables)) {
    if ((key === 'amount' || key === 'serviceFee' || key === 'penaltyAmount') && value) {
      processedVariables[`${key}Chinese`] = amountToChinese(value);
    }
  }

  let html = `
    <div style="font-family: Helvetica, Arial, 'Microsoft YaHei', sans-serif; background: #fff; padding: 40px; min-height: 100%;">
  `;

  template.content.forEach((line, index) => {
    let processedLine = line;
    for (const [key, value] of Object.entries(processedVariables)) {
      processedLine = processedLine.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    }

    if (index === 0) {
      html += `<h1 style="font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 20px;">${processedLine}</h1>`;
    } else if (processedLine === '') {
      html += `<div style="height: 8px;"></div>`;
    } else if (processedLine.match(/^[一二三四五六七八九十]+、/)) {
      html += `<p style="font-size: 12pt; font-weight: bold; line-height: 1.5; margin: 0 0 6px 0; text-align: left;">${processedLine}</p>`;
    } else {
      html += `<p style="font-size: 12pt; line-height: 1.5; margin: 0 0 6px 0; text-align: left;">${processedLine}</p>`;
    }
  });

  html += `</div>`;
  return html;
}
