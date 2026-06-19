import { v4 as uuidv4 } from 'uuid';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface Photo {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
  takenAt: Date;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  dominantColors: string[];
  description: string;
}

export interface StoryPageData {
  id: string;
  photoId: string;
  content: string;
}

export interface Story {
  id: string;
  title: string;
  weather: 'sunny' | 'cloudy' | 'rainy';
  coverColors: [string, string];
  pages: StoryPageData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MapMarker {
  id: string;
  photoId: string;
  latitude: number;
  longitude: number;
  locationName: string;
}

export interface RouteSegment {
  id: string;
  date: string;
  color: string;
  coordinates: [number, number][];
}

export interface EXIFData {
  date?: Date;
  latitude?: number;
  longitude?: number;
}

const ROUTE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export async function extractEXIF(file: File): Promise<EXIFData> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const dataView = new DataView(arrayBuffer);
      
      let offset = 2;
      let littleEndian = false;
      
      if (dataView.getUint16(0, false) !== 0xFFD8) {
        resolve({});
        return;
      }
      
      while (offset < dataView.byteLength) {
        const marker = dataView.getUint16(offset, false);
        offset += 2;
        
        if (marker === 0xFFE1) {
          const length = dataView.getUint16(offset, false);
          offset += 2;
          
          const exifHeader = String.fromCharCode(
            dataView.getUint8(offset),
            dataView.getUint8(offset + 1),
            dataView.getUint8(offset + 2),
            dataView.getUint8(offset + 3),
            dataView.getUint8(offset + 4),
            dataView.getUint8(offset + 5)
          );
          
          if (exifHeader === 'Exif\0\0') {
            offset += 6;
            
            const tiffOffset = offset;
            const byteOrder = dataView.getUint16(offset, false);
            littleEndian = byteOrder === 0x4949;
            offset += 2;
            
            const magicNumber = dataView.getUint16(offset, littleEndian);
            if (magicNumber !== 0x002A) {
              resolve({});
              return;
            }
            offset += 2;
            
            const ifd0Offset = dataView.getUint32(offset, littleEndian);
            const ifd0 = tiffOffset + ifd0Offset;
            
            let result: EXIFData = {};
            
            result = parseIFD(dataView, tiffOffset, ifd0, littleEndian, false);
            
            const exifIfdPointer = findTag(dataView, tiffOffset, ifd0, littleEndian, 0x8769);
            if (exifIfdPointer !== null) {
              const exifIfd = tiffOffset + exifIfdPointer;
              const exifData = parseIFD(dataView, tiffOffset, exifIfd, littleEndian, true);
              result = { ...result, ...exifData };
            }
            
            const gpsIfdPointer = findTag(dataView, tiffOffset, ifd0, littleEndian, 0x8825);
            if (gpsIfdPointer !== null) {
              const gpsIfd = tiffOffset + gpsIfdPointer;
              const gpsData = parseGPSIFD(dataView, tiffOffset, gpsIfd, littleEndian);
              result = { ...result, ...gpsData };
            }
            
            resolve(result);
            return;
          }
          
          offset += length - 2;
        } else if ((marker & 0xFF00) !== 0xFF00) {
          break;
        } else {
          const length = dataView.getUint16(offset, false);
          offset += length;
        }
      }
      
      resolve({});
    };
    reader.readAsArrayBuffer(file);
  });
}

function parseIFD(
  dataView: DataView,
  tiffOffset: number,
  ifdOffset: number,
  littleEndian: boolean,
  isExif: boolean
): EXIFData {
  const numEntries = dataView.getUint16(ifdOffset, littleEndian);
  const result: EXIFData = {};
  
  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    const tag = dataView.getUint16(entryOffset, littleEndian);
    
    if (isExif && tag === 0x9003) {
      const dateStr = readASCII(dataView, entryOffset + 8, 20, tiffOffset, littleEndian);
      if (dateStr) {
        const parts = dateStr.split(' ');
        if (parts.length === 2) {
          const datePart = parts[0].replace(/:/g, '-');
          const date = new Date(`${datePart}T${parts[1]}`);
          if (!isNaN(date.getTime())) {
            result.date = date;
          }
        }
      }
    } else if (!isExif && tag === 0x0132) {
      const dateStr = readASCII(dataView, entryOffset + 8, 20, tiffOffset, littleEndian);
      if (dateStr) {
        const parts = dateStr.split(' ');
        if (parts.length === 2) {
          const datePart = parts[0].replace(/:/g, '-');
          const date = new Date(`${datePart}T${parts[1]}`);
          if (!isNaN(date.getTime())) {
            result.date = date;
          }
        }
      }
    }
  }
  
  return result;
}

function parseGPSIFD(
  dataView: DataView,
  tiffOffset: number,
  ifdOffset: number,
  littleEndian: boolean
): EXIFData {
  const numEntries = dataView.getUint16(ifdOffset, littleEndian);
  const result: EXIFData = {};
  
  let latRef = 'N';
  let lngRef = 'E';
  let lat: number | undefined;
  let lng: number | undefined;
  
  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    const tag = dataView.getUint16(entryOffset, littleEndian);
    
    switch (tag) {
      case 0x0001:
        latRef = String.fromCharCode(dataView.getUint8(entryOffset + 8));
        break;
      case 0x0003:
        lngRef = String.fromCharCode(dataView.getUint8(entryOffset + 8));
        break;
      case 0x0002:
        lat = readRational(dataView, entryOffset + 8, tiffOffset, littleEndian);
        break;
      case 0x0004:
        lng = readRational(dataView, entryOffset + 8, tiffOffset, littleEndian);
        break;
    }
  }
  
  if (lat !== undefined && lng !== undefined) {
    result.latitude = latRef === 'S' ? -lat : lat;
    result.longitude = lngRef === 'W' ? -lng : lng;
  }
  
  return result;
}

function findTag(
  dataView: DataView,
  tiffOffset: number,
  ifdOffset: number,
  littleEndian: boolean,
  targetTag: number
): number | null {
  const numEntries = dataView.getUint16(ifdOffset, littleEndian);
  
  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    const tag = dataView.getUint16(entryOffset, littleEndian);
    
    if (tag === targetTag) {
      return dataView.getUint32(entryOffset + 8, littleEndian);
    }
  }
  
  return null;
}

function readASCII(
  dataView: DataView,
  offset: number,
  length: number,
  tiffOffset: number,
  littleEndian: boolean
): string | null {
  const type = dataView.getUint16(offset - 4, littleEndian);
  const count = dataView.getUint32(offset, littleEndian);
  
  if (type === 0x0002 && count <= 4) {
    let str = '';
    for (let i = 0; i < count - 1; i++) {
      str += String.fromCharCode(dataView.getUint8(offset + i));
    }
    return str;
  } else if (type === 0x0002) {
    const valueOffset = dataView.getUint32(offset, littleEndian);
    const actualOffset = tiffOffset + valueOffset;
    let str = '';
    for (let i = 0; i < count - 1; i++) {
      str += String.fromCharCode(dataView.getUint8(actualOffset + i));
    }
    return str;
  }
  
  return null;
}

function readRational(
  dataView: DataView,
  offset: number,
  tiffOffset: number,
  littleEndian: boolean
): number | undefined {
  const valueOffset = dataView.getUint32(offset, littleEndian);
  const actualOffset = tiffOffset + valueOffset;
  
  const degrees = dataView.getUint32(actualOffset, littleEndian) / dataView.getUint32(actualOffset + 4, littleEndian);
  const minutes = dataView.getUint32(actualOffset + 8, littleEndian) / dataView.getUint32(actualOffset + 12, littleEndian);
  const seconds = dataView.getUint32(actualOffset + 16, littleEndian) / dataView.getUint32(actualOffset + 20, littleEndian);
  
  return degrees + minutes / 60 + seconds / 3600;
}

export async function extractDominantColors(imageUrl: string, count = 2): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      const maxSize = 100;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      const pixelArray: [number, number, number][] = [];
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        
        if (a > 128) {
          pixelArray.push([r, g, b]);
        }
      }
      
      const colors = kMeans(pixelArray, Math.min(count, pixelArray.length));
      resolve(colors.map(([r, g, b]) => `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`));
    };
    
    img.onerror = () => {
      resolve(['#FC5C65', '#FEB72B']);
    };
    
    img.src = imageUrl;
  });
}

function kMeans(pixels: [number, number, number][], k: number): [number, number, number][] {
  if (pixels.length === 0) return [[252, 92, 101], [254, 183, 43]];
  if (k >= pixels.length) return pixels;
  
  let centroids: [number, number, number][] = [];
  for (let i = 0; i < k; i++) {
    centroids.push([...pixels[Math.floor(Math.random() * pixels.length)]]);
  }
  
  for (let iteration = 0; iteration < 10; iteration++) {
    const clusters: [number, number, number][][] = centroids.map(() => []);
    
    for (const pixel of pixels) {
      let minDist = Infinity;
      let closestCluster = 0;
      
      for (let i = 0; i < centroids.length; i++) {
        const dist = colorDistance(pixel, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          closestCluster = i;
        }
      }
      
      clusters[closestCluster].push(pixel);
    }
    
    for (let i = 0; i < centroids.length; i++) {
      if (clusters[i].length > 0) {
        centroids[i] = averageColor(clusters[i]);
      }
    }
  }
  
  return centroids;
}

function colorDistance(c1: [number, number, number], c2: [number, number, number]): number {
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) +
    Math.pow(c1[1] - c2[1], 2) +
    Math.pow(c1[2] - c2[2], 2)
  );
}

function averageColor(colors: [number, number, number][]): [number, number, number] {
  let r = 0, g = 0, b = 0;
  for (const color of colors) {
    r += color[0];
    g += color[1];
    b += color[2];
  }
  return [
    Math.round(r / colors.length),
    Math.round(g / colors.length),
    Math.round(b / colors.length)
  ];
}

export function generateRouteSegments(photos: Photo[]): RouteSegment[] {
  const dateGroups = new Map<string, Photo[]>();
  
  for (const photo of photos) {
    if (photo.latitude !== undefined && photo.longitude !== undefined) {
      const dateKey = photo.takenAt.toISOString().split('T')[0];
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, []);
      }
      dateGroups.get(dateKey)!.push(photo);
    }
  }
  
  const sortedDates = Array.from(dateGroups.keys()).sort();
  const segments: RouteSegment[] = [];
  
  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i];
    const groupPhotos = dateGroups.get(date)!;
    
    groupPhotos.sort((a, b) => a.takenAt.getTime() - b.takenAt.getTime());
    
    const coordinates: [number, number][] = groupPhotos
      .filter(p => p.latitude !== undefined && p.longitude !== undefined)
      .map(p => [p.latitude!, p.longitude!]);
    
    if (coordinates.length >= 2) {
      segments.push({
        id: uuidv4(),
        date,
        color: ROUTE_COLORS[i % ROUTE_COLORS.length],
        coordinates
      });
    }
  }
  
  return segments;
}

export async function exportStoryToPDF(
  story: Story,
  photos: Photo[],
  containerId: string
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  
  const coverColors = story.coverColors;
  pdf.setFillColor(...hexToRgb(coverColors[0]));
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  const gradient = pdf.gradient(0, 0, pageWidth, pageHeight, [
    hexToRgb(coverColors[0]),
    hexToRgb(coverColors[1])
  ], 'linear', 'N');
  pdf.setFillColor(gradient);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  pdf.setFontSize(32);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  
  const titleLines = pdf.splitTextToSize(story.title, contentWidth);
  const titleY = pageHeight / 2 - titleLines.length * 8;
  pdf.text(titleLines, pageWidth / 2, titleY, { align: 'center' });
  
  const dateRange = getDateRange(photos);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(dateRange, pageWidth / 2, pageHeight / 2 + 40, { align: 'center' });
  
  const sortedPhotos = [...photos].sort((a, b) => a.takenAt.getTime() - b.takenAt.getTime());
  
  for (let i = 0; i < sortedPhotos.length; i++) {
    const photo = sortedPhotos[i];
    const page = story.pages.find(p => p.photoId === photo.id);
    
    pdf.addPage();
    
    pdf.setFillColor(249, 249, 245);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    try {
      const canvas = await html2canvas(document.createElement('img'), {
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: photo.width,
        height: photo.height,
      });
      
      let imgWidth = contentWidth;
      let imgHeight = (photo.height / photo.width) * contentWidth;
      const maxImgHeight = pageHeight * 0.45;
      
      if (imgHeight > maxImgHeight) {
        imgHeight = maxImgHeight;
        imgWidth = (photo.width / photo.height) * maxImgHeight;
      }
      
      const imgX = (pageWidth - imgWidth) / 2;
      const imgY = margin;
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = photo.width;
      tempCanvas.height = photo.height;
      const tempCtx = tempCanvas.getContext('2d')!;
      
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          tempCtx.drawImage(img, 0, 0);
          resolve();
        };
        img.src = photo.url;
      });
      
      const imgData = tempCanvas.toDataURL('image/jpeg', 0.9);
      pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth, imgHeight);
      
      const textY = imgY + imgHeight + 20;
      
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin - 5, textY - 5, contentWidth + 10, pageHeight - textY - margin + 5, 5, 5, 'F');
      
      pdf.setFontSize(10);
      pdf.setTextColor(102, 102, 102);
      pdf.setFont('helvetica', 'italic');
      pdf.text(formatDate(photo.takenAt), margin, textY + 5);
      
      if (photo.locationName) {
        pdf.text(photo.locationName, pageWidth - margin, textY + 5, { align: 'right' });
      }
      
      if (page?.content) {
        pdf.setFontSize(11);
        pdf.setTextColor(51, 51, 51);
        pdf.setFont('helvetica', 'normal');
        const contentLines = pdf.splitTextToSize(
          page.content.replace(/[#*_`]/g, ''),
          contentWidth
        );
        pdf.text(contentLines, margin, textY + 20);
      }
      
    } catch (error) {
      console.error('Error rendering page to PDF:', error);
    }
  }
  
  pdf.save(`${story.title || '旅行故事'}.pdf`);
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [252, 92, 101];
}

function getDateRange(photos: Photo[]): string {
  if (photos.length === 0) return '';
  
  const sorted = [...photos].sort((a, b) => a.takenAt.getTime() - b.takenAt.getTime());
  const start = sorted[0].takenAt;
  const end = sorted[sorted.length - 1].takenAt;
  
  if (start.toDateString() === end.toDateString()) {
    return formatDate(start);
  }
  
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function createPhotoObject(file: File, exifData: EXIFData, dominantColors: string[]): Photo {
  return {
    id: uuidv4(),
    file,
    url: URL.createObjectURL(file),
    width: 0,
    height: 0,
    takenAt: exifData.date || new Date(),
    latitude: exifData.latitude,
    longitude: exifData.longitude,
    dominantColors,
    description: ''
  };
}

export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve({ width: 800, height: 600 });
    };
    img.src = url;
  });
}

export function parseMarkdown(text: string): string {
  let html = text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n/gim, '<br/>');
  
  return html;
}

export function generateShareLink(storyId: string): string {
  return `${window.location.origin}${window.location.pathname}?share=${storyId}`;
}

export function getWeatherIcon(weather: 'sunny' | 'cloudy' | 'rainy'): string {
  switch (weather) {
    case 'sunny': return '☀️';
    case 'cloudy': return '⛅';
    case 'rainy': return '🌧️';
    default: return '☀️';
  }
}

declare module 'jspdf' {
  interface jsPDF {
    gradient(x1: number, y1: number, x2: number, y2: number, colors: [number, number, number][], type: string, coords: string): string;
  }
}

(jsPDF as any).API.gradient = function(
  x1: number, y1: number, x2: number, y2: number,
  colors: [number, number, number][], type: string, coords: string
): string {
  return colors[0].join(', ');
};
