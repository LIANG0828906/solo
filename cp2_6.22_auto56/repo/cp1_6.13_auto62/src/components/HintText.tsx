import { useEffect, useState } from 'react';

export default function HintText() {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setOpacity(0.3);
    }, 3000);

    return () => clearTimeout(fadeTimer);
  }, []);

  return (
    <div
      className="hint-text"
      style={{
        opacity,
        transition: 'opacity 1s ease-out',
      }}
    >
      拖拽旋转 | 滚轮缩放
    </div>
  );
}
