declare module 'react-tagcloud' {
  interface Tag {
    value: string;
    count: number;
  }

  interface TagCloudProps {
    tags: Tag[];
    minSize?: number;
    maxSize?: number;
    colorOptions?: Record<string, string | number>;
    style?: React.CSSProperties;
    renderer?: (tag: Tag, size: number, color: string) => React.ReactNode;
    onClick?: (tag: Tag) => void;
    shuffle?: boolean;
    randomNumberGenerator?: () => number;
    disableRandomColor?: boolean;
  }

  const TagCloud: React.FC<TagCloudProps>;
  export default TagCloud;
}
