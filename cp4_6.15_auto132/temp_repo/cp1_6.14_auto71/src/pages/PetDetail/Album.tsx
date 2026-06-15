import React from 'react';

interface AlbumProps {
  petId: string;
}

const Album: React.FC<AlbumProps> = () => {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🖼️</div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">相册功能开发中</h3>
      <p className="text-gray-500">敬请期待更多精彩功能！</p>
    </div>
  );
};

export default Album;
