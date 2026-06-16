declare module 'wav-encoder' {
  export interface WavEncodeOptions {
    sampleRate: number;
    channelData: Float32Array[];
    bitDepth?: number;
    floatingPoint?: boolean;
  }

  export function encode(options: WavEncodeOptions): Promise<ArrayBuffer>;

  const wavEncoder: {
    encode: typeof encode;
  };

  export default wavEncoder;
}
