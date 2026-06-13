import { useCallback, useRef, useState } from 'react';
import { CanvasIcon, Icon, RenderProgress } from '@/types';
import { mixColors, getAverageBrightness } from '@/utils/colorUtils';
import { icons } from '@/data/icons';
const GRID_SIZE = 32;
const BASE_CANVAS_SIZE = 300;
const CELL_SIZE = BASE_CANVAS_SIZE / GRID_SIZE;
export function useCanvasRenderer() {
 const [renderProgress, setRenderProgress] = useState<RenderProgress>({
 percentage: 0,
 isComplete: true,
 });
 const renderedIconsRef = useRef<CanvasIcon[]>([]);
 const renderMosaic = useCallback(async (imageData: ImageData, selectedIcons: Icon[], onComplete: (icons: CanvasIcon[]) => void) => {
 setRenderProgress({ percentage: 0, isComplete: false });
 if (selectedIcons.length === 0) {
 setRenderProgress({ percentage: 100, isComplete: true });
 onComplete([]);
 return;
 }
 const cachedIcons = selectedIcons.map((icon) => ({
 ...icon,
 brightness: icon.brightness,
 }));
 const newIcons: CanvasIcon[] = [];
 const batchSize = 64;
 const totalCells = GRID_SIZE * GRID_SIZE;
 for (let batchStart = 0; batchStart < totalCells; batchStart += batchSize) {
 await new Promise((resolve) => setTimeout(resolve, 0));
 const batchEnd = Math.min(batchStart + batchSize, totalCells);
 for (let i = batchStart; i < batchEnd; i++) {
 const row = Math.floor(i / GRID_SIZE);
 const col = i % GRID_SIZE;
 const cellX = col * CELL_SIZE;
 const cellY = row * CELL_SIZE;
 const brightness = getAverageBrightness(imageData, cellX, cellY, CELL_SIZE, CELL_SIZE);
 let bestIcon = cachedIcons[0];
 let minDiff = Math.abs(brightness - cachedIcons[0].brightness);
 for (const icon of cachedIcons) {
 const diff = Math.abs(brightness - icon.brightness);
 if (diff < minDiff) {
 minDiff = diff;
 bestIcon = icon;
 }
 }
 const scale = 1.5 + (brightness / 255) * 1.5;
 const iconColor = imageData.data;
 const cellCenterX = cellX + CELL_SIZE / 2;
 const cellCenterY = cellY + CELL_SIZE / 2;
 const pixelIndex = ((Math.floor(cellCenterY) * imageData.width) + Math.floor(cellCenterX)) * 4;
 const cellColor = {
 r: iconColor[pixelIndex] || 128,
 g: iconColor[pixelIndex + 1] || 128,
 b: iconColor[pixelIndex + 2] || 128,
 };
 const blendedColor = mixColors(cellColor, bestIcon.color, 0.7);
 newIcons.push({
 id: `${bestIcon.id}_${i}_${Date.now()}`,
 iconId: bestIcon.id,
 x: cellCenterX,
 y: cellCenterY,
 scale,
 rotation: (Math.random() - 0.5) * 0.3,
 color: blendedColor,
 });
 }
 const progress = Math.round((batchEnd / totalCells) * 100);
 setRenderProgress({ percentage: progress, isComplete: false });
 }
 renderedIconsRef.current = newIcons;
 setRenderProgress({ percentage: 100, isComplete: true });
 onComplete(newIcons);
 }, []);
 const drawIcon = useCallback((ctx: CanvasRenderingContext2D, icon: CanvasIcon, iconData: Icon) => {
 ctx.save();
 ctx.translate(icon.x, icon.y);
 ctx.rotate(icon.rotation);
 ctx.scale(icon.scale, icon.scale);
 ctx.fillStyle = `rgb(${icon.color.r}, ${icon.color.g}, ${icon.color.b})`;
 ctx.beginPath();
 const path = new Path2D(iconData.path);
 ctx.fill(path);
 ctx.restore();
 }, []);
 const drawSelectedBorder = useCallback((ctx: CanvasRenderingContext2D, icon: CanvasIcon, iconData: Icon) => {
 ctx.save();
 ctx.translate(icon.x, icon.y);
 ctx.rotate(icon.rotation);
 ctx.scale(icon.scale, icon.scale);
 ctx.strokeStyle = '#3b82f6';
 ctx.lineWidth = 2;
 ctx.setLineDash([4, 4]);
 const path = new Path2D(iconData.path);
 const bounds = ctx.measureText('');
 ctx.stroke(path);
 ctx.restore();
 }, []);
 const drawWaterRipple = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, progress: number) => {
 const centerX = width / 2;
 const centerY = height / 2;
 const maxRadius = Math.sqrt(width * width + height * height);
 const radius = maxRadius * progress;
 ctx.save();
 ctx.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`;
 ctx.lineWidth = 3;
 ctx.beginPath();
 ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
 ctx.stroke();
 ctx.restore();
 }, []);
 const exportHighResPNG = useCallback(async (canvasIcons: CanvasIcon[], onProgress?: (progress: number) => void): Promise<Blob> => {
 const TARGET_WIDTH = 3840;
 const TARGET_HEIGHT = 2160;
 const TILE_SIZE = 512;
 const numTilesX = Math.ceil(TARGET_WIDTH / TILE_SIZE);
 const numTilesY = Math.ceil(TARGET_HEIGHT / TILE_SIZE);
 const finalCanvas = document.createElement('canvas');
 finalCanvas.width = TARGET_WIDTH;
 finalCanvas.height = TARGET_HEIGHT;
 const finalCtx = finalCanvas.getContext('2d');
 if (!finalCtx) {
 throw new Error('无法创建Canvas上下文');
 }
 const scaleX = TARGET_WIDTH / BASE_CANVAS_SIZE;
 const scaleY = TARGET_HEIGHT / BASE_CANVAS_SIZE;
 let tileIndex = 0;
 const totalTiles = numTilesX * numTilesY;
 for (let ty = 0; ty < numTilesY; ty++) {
 for (let tx = 0; tx < numTilesX; tx++) {
 await new Promise((resolve) => setTimeout(resolve, 0));
 const tileCanvas = document.createElement('canvas');
 tileCanvas.width = TILE_SIZE;
 tileCanvas.height = TILE_SIZE;
 const tileCtx = tileCanvas.getContext('2d');
 if (!tileCtx)
 continue;
 tileCtx.fillStyle = '#1a1a2e';
 tileCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
 const startX = tx * TILE_SIZE / scaleX;
 const startY = ty * TILE_SIZE / scaleY;
 const endX = Math.min(startX + TILE_SIZE / scaleX, BASE_CANVAS_SIZE);
 const endY = Math.min(startY + TILE_SIZE / scaleY, BASE_CANVAS_SIZE);
 for (const icon of canvasIcons) {
 if (icon.x >= startX && icon.x <= endX && icon.y >= startY && icon.y <= endY) {
 const iconData = icons.find((i) => i.id === icon.iconId);
 if (!iconData)
 continue;
 const screenX = (icon.x - startX) * scaleX;
 const screenY = (icon.y - startY) * scaleY;
 const screenScale = icon.scale * Math.min(scaleX, scaleY);
 tileCtx.save();
 tileCtx.translate(screenX, screenY);
 tileCtx.rotate(icon.rotation);
 tileCtx.scale(screenScale, screenScale);
 tileCtx.fillStyle = `rgb(${icon.color.r}, ${icon.color.g}, ${icon.color.b})`;
 const path = new Path2D(iconData.path);
 tileCtx.fill(path);
 tileCtx.restore();
 }
 }
 finalCtx.drawImage(tileCanvas, tx * TILE_SIZE, ty * TILE_SIZE);
 tileIndex++;
 onProgress?.((tileIndex / totalTiles) * 100);
 }
 }
 return new Promise((resolve) => {
 finalCanvas.toBlob((blob) => {
 if (blob)
 resolve(blob);
 else
 throw new Error('导出失败');
 }, 'image/png');
 });
 }, []);
 return {
 renderProgress,
 renderMosaic,
 drawIcon,
 drawSelectedBorder,
 drawWaterRipple,
 exportHighResPNG,
 };
}
