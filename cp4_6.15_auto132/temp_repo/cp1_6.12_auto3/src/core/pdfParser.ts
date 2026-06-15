import * as pdfjsLib from 'pdfjs-dist';
import { PDFPageText } from '@/types';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export async function parsePDF(
  pdfFile: File,
  onProgress?: (progress: number, message: string) => void
): Promise<PDFPageText[]> {
  if (onProgress) {
    onProgress(0, '正在加载PDF文件...');
  }

  const arrayBuffer = await pdfFile.arrayBuffer();
  
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const totalPages = pdf.numPages;
  const pages: PDFPageText[] = [];

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) {
      onProgress(
        (i / totalPages) * 100,
        `正在解析第 ${i}/${totalPages} 页...`
      );
    }

    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    const textBlocks: string[] = [];
    let currentLine = '';
    let lastY: number | null = null;
    
    for (const item of textContent.items) {
      if ('str' in item) {
        const textItem = item as pdfjsLib.TextItem;
        const y = textItem.transform[5];
        
        if (lastY !== null && Math.abs(y - lastY) > 5) {
          if (currentLine.trim()) {
            textBlocks.push(currentLine.trim());
          }
          currentLine = textItem.str;
        } else {
          currentLine += textItem.str;
        }
        
        lastY = y;
      }
    }
    
    if (currentLine.trim()) {
      textBlocks.push(currentLine.trim());
    }

    const fullText = textBlocks.join('\n');

    pages.push({
      pageNumber: i,
      textBlocks,
      fullText,
    });
  }

  if (onProgress) {
    onProgress(100, 'PDF解析完成');
  }

  return pages;
}

export function getPDFThumbnail(
  pdfFile: File,
  pageNumber: number = 1
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageNumber);
      
      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'));
        return;
      }
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };
      
      await page.render(renderContext).promise;
      
      resolve(canvas.toDataURL('image/png'));
    } catch (error) {
      reject(error);
    }
  });
}
