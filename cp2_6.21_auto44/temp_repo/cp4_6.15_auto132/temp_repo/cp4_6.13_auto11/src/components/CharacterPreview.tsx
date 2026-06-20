import { useEffect, useRef, useMemo } from 'react';
import type { CharacterState, LayerVisibility } from '@/types/character';
import { RACE_TEMPLATES, CLASS_TEMPLATES, SPRITE_SIZE, PREVIEW_SCALE } from '@/utils/pixelTemplates';
import { renderCharacter, clearCanvas, drawGlowEffect } from '@/utils/renderLayers';

interface CharacterPreviewProps {
  character: CharacterState;
  hairIndex: number;
  visibility: LayerVisibility;
}

const CANVAS_SCALE = PREVIEW_SCALE;

export default function CharacterPreview({
  character,
  hairIndex,
  visibility,
}: CharacterPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const dirtyRef = useRef(true);

  const templates = useMemo(() => {
    const raceTpl = RACE_TEMPLATES[character.race];
    const classTpl = CLASS_TEMPLATES[character.characterClass];
    const safeHairIdx = hairIndex >= 0 && hairIndex < raceTpl.hair.length
      ? hairIndex
      : raceTpl.defaultHairIndex;
    return {
      body: raceTpl.body,
      hair: raceTpl.hair[safeHairIdx],
      clothes: classTpl.clothes,
      weapon: classTpl.weapon,
      accessory: classTpl.accessory,
    };
  }, [character.race, character.characterClass, hairIndex]);

  const canvasSize = useMemo(() => ({
    width: SPRITE_SIZE.width * CANVAS_SCALE,
    height: SPRITE_SIZE.height * CANVAS_SCALE,
  }), []);

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    clearCanvas(ctx, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 4;
    drawGlowEffect(
      ctx,
      centerX,
      centerY,
      canvas.width * 0.42,
      canvas.height * 0.42,
      'rgba(233, 69, 96, 0.22)',
    );

    const charW = SPRITE_SIZE.width * CANVAS_SCALE;
    const charH = SPRITE_SIZE.height * CANVAS_SCALE;
    const offsetX = Math.floor((canvas.width - charW) / 2);
    const offsetY = Math.floor((canvas.height - charH) / 2);

    renderCharacter({
      ctx,
      bodyTemplate: templates.body,
      hairTemplate: templates.hair,
      clothesTemplate: templates.clothes,
      weaponTemplate: templates.weapon,
      accessoryTemplate: templates.accessory,
      colors: character.colors,
      scale: CANVAS_SCALE,
      offsetX,
      offsetY,
      visibility,
    });

    dirtyRef.current = false;
  };

  useEffect(() => {
    dirtyRef.current = true;
    const loop = () => {
      if (dirtyRef.current) {
        render();
      }
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    render();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [character, templates, visibility]);

  return (
    <div className="preview-wrapper">
      <div className="preview-glow-frame">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="preview-canvas"
        />
      </div>
      <div className="preview-label">
        <span className="label-dot" />
        REAL-TIME RENDER
      </div>
    </div>
  );
}
