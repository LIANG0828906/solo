import html2canvas from 'html2canvas';
import React from 'react';
import ReactPDF, { Document, Page, Image, StyleSheet } from '@react-pdf/renderer';
import type { JournalPage as StoreJournalPage } from '@/store/useJournalStore';

export type JournalPage = StoreJournalPage;

const styles = StyleSheet.create({
  page: {
    size: 'A4',
    padding: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
});

function formatDate(date: Date): string {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

function createPdfDocument(dataUrls: string[]): React.ReactElement {
  return React.createElement(
    Document,
    null,
    dataUrls.map((dataUrl, index) =>
      React.createElement(
        Page,
        { key: index, size: 'A4', style: styles.page },
        React.createElement(Image, { src: dataUrl, style: styles.image })
      )
    )
  );
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export async function exportToPDF(
  journalId: string,
  pages: JournalPage[],
  onProgress?: (progress: number) => void
): Promise<void> {
  if (pages.length === 0) {
    throw new Error('没有可导出的页面');
  }

  const dataUrls: string[] = [];
  const total = pages.length;

  onProgress?.(0);

  for (let i = 0; i < total; i++) {
    const page = pages[i];
    const elementId = `page-${page.id}`;
    const element = document.getElementById(elementId);

    if (!element) {
      throw new Error(`找不到页面元素: ${elementId}`);
    }

    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      scale: 2,
      logging: false,
    });

    const dataUrl = canvas.toDataURL('image/png');
    dataUrls.push(dataUrl);

    const progress = Math.round(((i + 1) / total) * 100);
    onProgress?.(progress);
  }

  const pdfDocument = createPdfDocument(dataUrls);
  const instance = ReactPDF.pdf(pdfDocument);
  const blob = await instance.toBlob();

  const filename = `MyJournal_${formatDate(new Date())}.pdf`;
  triggerDownload(blob, filename);

  void journalId;
}
