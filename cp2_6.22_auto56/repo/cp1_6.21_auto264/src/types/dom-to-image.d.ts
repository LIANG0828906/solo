declare module 'dom-to-image' {
  interface Options {
    filter?: ((node: Node) => boolean) | undefined;
    bgcolor?: string | undefined;
    width?: number | undefined;
    height?: number | undefined;
    style?: Record<string, string> | undefined;
    quality?: number | undefined;
    imagePlaceholder?: string | undefined;
    cacheBust?: boolean | undefined;
    pixelRatio?: number | undefined;
  }

  const domToImage: {
    toSvg(node: Node, options?: Options): Promise<string>;
    toPng(node: Node, options?: Options): Promise<string>;
    toJpeg(node: Node, options?: Options): Promise<string>;
    toBlob(node: Node, options?: Options): Promise<Blob>;
    toPixelData(node: Node, options?: Options): Promise<Uint8ClampedArray>;
    draw(domNode: Node, options?: Options): Promise<HTMLCanvasElement>;
    toCanvas(node: Node, options?: Options): Promise<HTMLCanvasElement>;
    toSvgDataURL(node: Node, options?: Options): Promise<string>;
    impl: {
      fontFaces: { impl: unknown };
      images: { impl: unknown };
      util: unknown;
      inliner: unknown;
      options: unknown;
      node: { impl: unknown };
    };
  };

  export default domToImage;
}
