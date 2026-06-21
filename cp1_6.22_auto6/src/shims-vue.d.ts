declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'three/examples/jsm/loaders/GLTFLoader.js' {
  import * as THREE from 'three'
  
  export class GLTFLoader extends THREE.Loader {
    load(
      url: string,
      onLoad?: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void
    
    parse(
      data: ArrayBuffer | string,
      path: string,
      onLoad: (gltf: GLTF) => void,
      onError?: (event: ErrorEvent) => void
    ): void
  }
  
  export interface GLTF {
    scene: THREE.Group
    scenes: THREE.Group[]
    animations: THREE.AnimationClip[]
    asset: object
    cameras: THREE.Camera[]
    parser: object
    userData: object
  }
}

declare module 'three/examples/jsm/controls/OrbitControls.js' {
  import * as THREE from 'three'
  
  export class OrbitControls extends THREE.EventDispatcher {
    constructor(camera: THREE.Camera, domElement?: HTMLElement)
    
    enabled: boolean
    target: THREE.Vector3
    minDistance: number
    maxDistance: number
    minZoom: number
    maxZoom: number
    minPolarAngle: number
    maxPolarAngle: number
    minAzimuthAngle: number
    maxAzimuthAngle: number
    enableDamping: boolean
    dampingFactor: number
    enableZoom: boolean
    zoomSpeed: number
    enableRotate: boolean
    rotateSpeed: number
    enablePan: boolean
    panSpeed: number
    screenSpacePanning: boolean
    keyPanSpeed: number
    autoRotate: boolean
    autoRotateSpeed: number
    keys: {
      LEFT: string
      UP: string
      RIGHT: string
      BOTTOM: string
    }
    mouseButtons: {
      LEFT: number
      MIDDLE: number
      RIGHT: number
    }
    touches: {
      ONE: number
      TWO: number
    }
    
    update(): boolean
    saveState(): void
    reset(): void
    dispose(): void
    getAzimuthalAngle(): number
    getPolarAngle(): number
    getDistance(): number
  }
}
