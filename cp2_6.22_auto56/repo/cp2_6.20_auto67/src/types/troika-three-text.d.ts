declare module 'troika-three-text' {
  import * as THREE from 'three';

  export interface TextProps {
    text?: string;
    fontSize?: number;
    color?: THREE.Color | string | number;
    anchorX?: number | string;
    anchorY?: number | string;
    depthOffset?: number;
    direction?: string;
    overflowWrap?: string;
    whiteSpace?: string;
    textAlign?: string;
    maxWidth?: number;
    lineHeight?: number;
    letterSpacing?: number;
    indent?: number;
    outlineWidth?: number;
    outlineColor?: THREE.Color | string | number;
    outlineOpacity?: number;
    fillOpacity?: number;
    strokeWidth?: number;
    strokeColor?: THREE.Color | string | number;
    strokeOpacity?: number;
    renderOrder?: number;
    clipRect?: [number, number, number, number];
    material?: THREE.Material;
    sdfGlyphSize?: number;
    font?: string;
    fontWeight?: number | string;
    fontStyle?: string;
    position?: [number, number, number] | THREE.Vector3;
    rotation?: [number, number, number] | THREE.Euler;
    scale?: [number, number, number] | THREE.Vector3;
    quaternion?: [number, number, number, number] | THREE.Quaternion;
    matrix?: THREE.Matrix4;
    name?: string;
    userData?: any;
    visible?: boolean;
    castShadow?: boolean;
    receiveShadow?: boolean;
    frustumCulled?: boolean;
    renderOrder?: number;
    onAfterRender?: (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, geometry: THREE.BufferGeometry, material: THREE.Material, group: THREE.Group) => void;
    onBeforeRender?: (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, geometry: THREE.BufferGeometry, material: THREE.Material, group: THREE.Group) => void;
  }

  export class Text extends THREE.Mesh {
    constructor(props?: TextProps);
    text: string;
    fontSize: number;
    color: THREE.Color;
    anchorX: number | string;
    anchorY: number | string;
    anchorZ: number;
    depthOffset: number;
    direction: string;
    overflowWrap: string;
    whiteSpace: string;
    textAlign: string;
    maxWidth: number;
    lineHeight: number;
    letterSpacing: number;
    indent: number;
    outlineWidth: number;
    outlineColor: THREE.Color;
    outlineOpacity: number;
    fillOpacity: number;
    strokeWidth: number;
    strokeColor: THREE.Color;
    strokeOpacity: number;
    sdfGlyphSize: number;
    font: string;
    fontWeight: number | string;
    fontStyle: string;
    material: THREE.Material;
    clipRect: [number, number, number, number] | null;
    textRenderInfo: any;
    sync(): void;
    dispose(): void;
  }
}
