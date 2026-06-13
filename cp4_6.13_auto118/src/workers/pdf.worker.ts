/// <reference lib="webworker" />

importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js');

import type {
  WorkerMessage,
  WorkerResult,
  ParsePageResult,
  TextItem,
} from '../../shared/types';

declare global {
  interface Window {
    pdfjsLib: typeof import('pdfjs-dist');
  }
}

interface PdfJsGlobal {
  getDocument: (options: { data: ArrayBuffer }) => {
    promise: Promise<{
      numPages: number;
      getPage: (pageNum: number) => Promise<{
        getViewport: (options: { scale: number }) => { width: number; height: number };
        getTextContent: () => Promise<{
          items: Array<{
            str: string;
            transform: number[];
            width: number;
            height: number;
            fontName: string;
          }>;
        }>;
        render: (options: {
          canvasContext: CanvasRenderingContext2D;
          viewport: { width: number; height: number };
        }) => { promise: Promise<void> };
      }>;
      destroy: () => void;
    }>;
  };
  GlobalWorkerOptions: {
    workerSrc: string;
  };
}

declare const self: DedicatedWorkerGlobalScope & { pdfjsLib: PdfJsGlobal };

self.pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';

let isCancelled = false;
let pdfDoc: { destroy: () => void } | null = null;

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, data } = e.data;

  switch (type) {
    case 'PARSE_PDF':
      isCancelled = false;
      await parsePdf(data as ArrayBuffer);
      break;
    case 'CANCEL':
      isCancelled = true;
      if (pdfDoc) {
        try {
          pdfDoc.destroy();
        } catch (e) {
          console.error('Error destroying PDF:', e);
        }
        pdfDoc = null;
      }
      sendResult('PARSE_ERROR', { message: '解析已取消' });
      break;
  }
};

async function parsePdf(arrayBuffer: ArrayBuffer) {
  try {
    const startTime = Date.now();

    sendResult('PROGRESS', {
      phase: 'loading',
      progress: 0,
      message: '正在加载PDF...',
    });

    const loadingTask = self.pdfjsLib.getDocument({ data: arrayBuffer });
    pdfDoc = await loadingTask.promise;

    const totalPages = pdfDoc.numPages;

    sendResult('PROGRESS', {
      phase: 'parsing',
      progress: 5,
      totalPages,
      message: `共 ${totalPages} 页，开始解析...`,
    });

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (isCancelled) break;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const pageResult = await parsePage(page, pageNum);

        sendResult('PAGE_PARSED', pageResult);

        const progress = Math.round(((pageNum + 1) / (totalPages + 2)) * 100);
        const elapsed = Date.now() - startTime;
        const avgTimePerPage = elapsed / pageNum;
        const remainingPages = totalPages - pageNum;
        const estimatedRemaining = Math.round(avgTimePerPage * remainingPages / 1000);

        sendResult('PROGRESS', {
          phase: 'parsing',
          progress,
          currentPage: pageNum,
          totalPages,
          estimatedRemaining,
          message: `已解析 ${pageNum}/${totalPages} 页，预计剩余 ${estimatedRemaining} 秒`,
        });

        await new Promise((resolve) => setTimeout(resolve, 10));
      } catch (pageError) {
        console.error(`Error parsing page ${pageNum}:`, pageError);
        sendResult('PROGRESS', {
          phase: 'parsing',
          progress: Math.round(((pageNum + 1) / (totalPages + 2)) * 100),
          currentPage: pageNum,
          totalPages,
          message: `第 ${pageNum} 页解析失败，跳过...`,
          error: true,
        });
      }
    }

    if (!isCancelled) {
      sendResult('PROGRESS', {
        phase: 'complete',
        progress: 100,
        totalPages,
        message: '解析完成！',
      });

      sendResult('PARSE_COMPLETE', {
        totalPages,
        totalTime: Math.round((Date.now() - startTime) / 1000),
      });
    }

    if (pdfDoc) {
      pdfDoc.destroy();
      pdfDoc = null;
    }
  } catch (error) {
    console.error('PDF parsing error:', error);
    sendResult('PARSE_ERROR', {
      message: error instanceof Error ? error.message : 'PDF解析失败',
    });
  }
}

async function parsePage(
  page: {
    getViewport: (options: { scale: number }) => { width: number; height: number };
    getTextContent: () => Promise<{
      items: Array<{
        str: string;
        transform: number[];
        width: number;
        height: number;
        fontName: string;
      }>;
    }>;
    render: (options: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
    }) => { promise: Promise<void> };
  },
  pageNumber: number
): Promise<ParsePageResult> {
  const viewport = page.getViewport({ scale: 1.5 });
  const scale = 0.3;
  const thumbnailViewport = page.getViewport({ scale });

  const canvas = new OffscreenCanvas(
    Math.floor(thumbnailViewport.width),
    Math.floor(thumbnailViewport.height)
  );
  const ctx = canvas.getContext('2d')!;

  await page.render({
    canvasContext: ctx,
    viewport: thumbnailViewport,
  }).promise;

  const thumbnailBlob = await canvas.convertToBlob({ type: 'image/png' });
  const thumbnailArrayBuffer = await thumbnailBlob.arrayBuffer();
  const thumbnail = arrayBufferToBase64(thumbnailArrayBuffer);

  const textContent = await page.getTextContent();
  const textItems: TextItem[] = [];

  for (const item of textContent.items) {
    if ('str' in item && item.str.trim()) {
      const transform = item.transform;
      const x = transform[4];
      const y = transform[5];

      textItems.push({
        str: item.str,
        x,
        y,
        width: item.width,
        height: item.height,
        fontName: item.fontName,
      });
    }
  }

  return {
    pageNumber,
    thumbnail,
    textItems,
    textContent: textItems.map((t) => t.str).join(' '),
    pageWidth: viewport.width,
    pageHeight: viewport.height,
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function sendResult(type: WorkerResult['type'], data: unknown) {
  self.postMessage({ type, data });
}
