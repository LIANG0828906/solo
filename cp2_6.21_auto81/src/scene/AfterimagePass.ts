import * as THREE from 'three'
import { Pass } from 'postprocessing'

export class AfterimagePass extends Pass {
  private historyTexture: THREE.WebGLRenderTarget | null = null
  private material: THREE.ShaderMaterial
  private copyMaterial: THREE.MeshBasicMaterial
  private fsCamera: THREE.OrthographicCamera
  private fsScene: THREE.Scene
  private quad: THREE.Mesh

  public damp: number = 0.88

  constructor() {
    super()

    this.fsScene = new THREE.Scene()
    this.fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const geometry = new THREE.PlaneGeometry(2, 2)

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tHistory: { value: null },
        damp: { value: 0.88 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tHistory;
        uniform float damp;
        varying vec2 vUv;
        void main() {
          vec4 current = texture2D(tDiffuse, vUv);
          vec4 history = texture2D(tHistory, vUv);
          gl_FragColor = current + history * damp;
        }
      `,
      transparent: false,
      depthTest: false,
      depthWrite: false,
    })

    this.copyMaterial = new THREE.MeshBasicMaterial({
      map: null,
    })

    this.quad = new THREE.Mesh(geometry, this.material)
    this.fsScene.add(this.quad)
  }

  render(
    renderer: THREE.WebGLRenderer,
    readBuffer: THREE.WebGLRenderTarget,
    writeBuffer: THREE.WebGLRenderTarget,
  ): void {
    if (!this.historyTexture) {
      this.historyTexture = new THREE.WebGLRenderTarget(
        readBuffer.width,
        readBuffer.height,
        {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
          type: readBuffer.texture.type,
        }
      )
      renderer.setRenderTarget(this.historyTexture)
      renderer.clear()
    }

    if (
      this.historyTexture.width !== readBuffer.width ||
      this.historyTexture.height !== readBuffer.height
    ) {
      this.historyTexture.setSize(readBuffer.width, readBuffer.height)
    }

    this.material.uniforms.tDiffuse.value = readBuffer.texture
    this.material.uniforms.tHistory.value = this.historyTexture.texture
    this.material.uniforms.damp.value = this.damp

    this.quad.material = this.material
    renderer.setRenderTarget(writeBuffer)
    renderer.render(this.fsScene, this.fsCamera)

    this.quad.material = this.copyMaterial
    this.copyMaterial.map = writeBuffer.texture
    renderer.setRenderTarget(this.historyTexture)
    renderer.render(this.fsScene, this.fsCamera)
  }

  dispose(): void {
    super.dispose()
    this.material.dispose()
    this.copyMaterial.dispose()
    if (this.historyTexture) {
      this.historyTexture.dispose()
    }
  }
}
