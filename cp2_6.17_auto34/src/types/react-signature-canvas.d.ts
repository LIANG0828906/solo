declare module 'react-signature-canvas' {
  import { Component, CSSProperties } from 'react'

  interface SignatureCanvasProps {
    penColor?: string
    backgroundColor?: string
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement> & {
      className?: string
    }
    velocityFilterWeight?: number
    minWidth?: number
    maxWidth?: number
    dotSize?: number | (() => number)
  }

  class SignatureCanvas extends Component<SignatureCanvasProps> {
    clear(): void
    isEmpty(): boolean
    getSignatureImage(): string
    getTrimmedCanvas(): HTMLCanvasElement
    toDataURL(type?: string, quality?: number): string
    fromDataURL(dataUrl: string, options?: { ratio?: number; width?: number; height?: number; xOffset?: number; yOffset?: number }): Promise<void>
    off(): void
    on(): void
  }

  export default SignatureCanvas
}
