import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PartData } from '@/types';

/**
 * 部件信息标签组件
 *
 * 职责：使用 HTML Canvas 渲染半透明圆角背景的文字标签，
 *       以 Sprite 形式悬浮在部件上方，字体大小根据相机距离自适应缩放。
 *
 * 自适应缩放逻辑：
 *   根据 camera.position 与 sprite.worldPosition 的实时距离，
 *   映射到 0.6 ~ 1.8 的 scale 区间，避免标签过大遮挡或过小看不清。
 *
 * 调用方：PartMesh 组件为每个部件实例化一个本组件
 */

interface PartLabelProps {
  part: PartData;
  worldPosition: THREE.Vector3;
}

const CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 64;
const LABEL_OFFSET_Y = 1.2;
const MIN_SCALE = 0.6;
const MAX_SCALE = 1.8;
const SCALE_DISTANCE_FACTOR = 0.2;

function createLabelTexture(part: PartData): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(22, 33, 62, 0.85)';
  const radius = 12;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(CANVAS_WIDTH - radius, 0);
  ctx.quadraticCurveTo(CANVAS_WIDTH, 0, CANVAS_WIDTH, radius);
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - radius);
  ctx.quadraticCurveTo(CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_WIDTH - radius, CANVAS_HEIGHT);
  ctx.lineTo(radius, CANVAS_HEIGHT);
  ctx.quadraticCurveTo(0, CANVAS_HEIGHT, 0, CANVAS_HEIGHT - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = part.color;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(part.label, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function PartLabel({ part, worldPosition }: PartLabelProps) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const { camera } = useThree();

  const texture = useMemo(
    () => createLabelTexture(part),
    [part.label, part.color]
  );

  useFrame(() => {
    if (!spriteRef.current) return;

    const distance = camera.position.distanceTo(worldPosition);
    const scale = Math.max(
      MIN_SCALE,
      Math.min(MAX_SCALE, distance * SCALE_DISTANCE_FACTOR)
    );

    spriteRef.current.scale.set(scale * 1.6, scale * 0.4, 1);
    spriteRef.current.position.set(
      worldPosition.x,
      worldPosition.y + LABEL_OFFSET_Y,
      worldPosition.z
    );
  });

  return (
    <sprite
      ref={spriteRef}
      position={[
        worldPosition.x,
        worldPosition.y + LABEL_OFFSET_Y,
        worldPosition.z,
      ]}
    >
      <spriteMaterial
        map={texture}
        transparent
        depthTest={false}
        depthWrite={false}
        sizeAttenuation
      />
    </sprite>
  );
}
