import React, { useRef, useEffect, useCallback } from 'react';
import { Grid3X3 } from 'lucide-react';
import { FontRenderer } from '../renderer/fontRenderer';
import { StyleTransfer } from '../engine/styleTransfer';
import {
  useAppStore,
  selectGeneProfile,
  selectRecognizedGlyphs,
  selectPreviewText,
} from '../stores/appStore';
import { CharGlyph } from '../types';

export const PreviewArea: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<FontRenderer | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<{
    glyphs: CharGlyph[];
    transformedGlyphs: Map<string, CharGlyph>;
    previewText: string;
  } | null>(null);

  const geneProfile = useAppStore(selectGeneProfile);
  const recognizedGlyphs = useAppStore(selectRecognizedGlyphs);
  const previewText = useAppStore(selectPreviewText);

  const initRenderer = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const width = containerRef.current.clientWidth;
    const height = 300;

    if (rendererRef.current) {
      rendererRef.current.destroy();
    }

    rendererRef.current = new FontRenderer(canvas);
    rendererRef.current.resize(width, height);
    rendererRef.current.drawGrid();
  }, []);

  const scheduleUpdate = useCallback(() => {
    if (pendingUpdateRef.current) return;

    pendingUpdateRef.current = {
      glyphs: recognizedGlyphs,
      transformedGlyphs: new Map(),
      previewText,
    };

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        const update = pendingUpdateRef.current;
        pendingUpdateRef.current = null;
        rafRef.current = null;

        if (update && rendererRef.current) {
          const transformed = StyleTransfer.transformAllGlyphs(
            update.glyphs,
            geneProfile
          );

          rendererRef.current.drawGrid();

          if (update.glyphs.length > 0) {
            rendererRef.current.drawGlyphOnGrid(update.glyphs[0]);
          }

          rendererRef.current.drawPreviewText(update.previewText, transformed);
        }
      });
    }
  }, [recognizedGlyphs, previewText, geneProfile]);

  useEffect(() => {
    initRenderer();

    const handleResize = () => {
      initRenderer();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      rendererRef.current?.destroy();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [initRenderer]);

  useEffect(() => {
    if (rendererRef.current && recognizedGlyphs.length > 0) {
      scheduleUpdate();
    } else if (rendererRef.current) {
      rendererRef.current.drawGrid();
    }
  }, [recognizedGlyphs, geneProfile, previewText, scheduleUpdate]);

  return (
    <div className="bg-[#1E1E2E] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Grid3X3 size={18} className="text-[#4ECDC4]" />
        <h2 className="text-[16px] font-semibold text-white">实时预览</h2>
      </div>

      <div
        ref={containerRef}
        className="relative w-full rounded-xl overflow-hidden"
        style={{ height: '300px', maxWidth: '400px', margin: '0 auto' }}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
        />

        {recognizedGlyphs.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-[#6B6B7B] text-sm">
                识别到0个字符
              </p>
              <p className="text-[#6B6B7B] text-xs mt-1">
                请上传图片或手写文字进行识别
              </p>
            </div>
          </div>
        )}
      </div>

      {recognizedGlyphs.length > 0 && (
        <div className="mt-4">
          <p className="text-[13px] text-[#888899] mb-2 font-medium">
            已识别字符 ({recognizedGlyphs.length} 个):
          </p>
          <div className="flex flex-wrap gap-2">
            {recognizedGlyphs.slice(0, 10).map((glyph, index) => (
              <span
                key={`${glyph.char}-${index}`}
                className="
                  px-3 py-1.5 rounded-lg bg-[#2D2D44] text-[#4ECDC4] text-sm font-medium
                  border border-[#3D3D5C]
                "
              >
                {glyph.char}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
