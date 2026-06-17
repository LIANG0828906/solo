import React, { useRef, useState } from 'react';
import { useArtworkStore } from '@/store/artworkStore';
import { copyToClipboard, generateThumbnail, downloadCanvasAsPNG } from '@/utils/storage';
import './ShareBar.css';

interface ShareBarProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const ShareBar: React.FC<ShareBarProps> = ({ canvasRef }) => {
  const title = useArtworkStore((state) => state.title);
  const author = useArtworkStore((state) => state.author);
  const artId = useArtworkStore((state) => state.artId);
  const isGeneratingId = useArtworkStore((state) => state.isGeneratingId);
  const setTitle = useArtworkStore((state) => state.setTitle);
  const setAuthor = useArtworkStore((state) => state.setAuthor);
  const generateArtIdAction = useArtworkStore((state) => state.generateArtIdAction);
  const saveToGallery = useArtworkStore((state) => state.saveToGallery);

  const [copied, setCopied] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);

  const handleShare = async () => {
    if (!canvasRef.current) return;

    const shareText = `${title || '未命名作品'} - ${author || '匿名'}\n艺术品ID: ${artId || '未生成'}\n\n用 PixelArt NFT Generator 创建你的独特数字艺术品！`;
    
    const success = await copyToClipboard(shareText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateId = () => {
    generateArtIdAction();
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const thumbnail = generateThumbnail(canvasRef.current, 100, 100);
    saveToGallery(thumbnail);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const filename = title ? `${title}.png` : 'nft-artwork.png';
    downloadCanvasAsPNG(canvasRef.current, filename);
  };

  return (
    <div className="share-bar">
      <div className="metadata-section">
        <div className={`input-wrapper ${titleFocused ? 'focused' : ''}`}>
          <label className="input-label">作品标题</label>
          <input
            type="text"
            className="title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTitleFocused(false)}
            placeholder="输入作品名称..."
            maxLength={30}
          />
          <div className="input-underline" />
        </div>

        <div className="input-wrapper">
          <label className="input-label">创作者署名</label>
          <input
            type="text"
            className="author-input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="你的名字..."
            maxLength={20}
          />
        </div>

        <div className="art-id-section">
          <span className="id-label">艺术品ID</span>
          <div className={`art-id ${artId ? 'has-id' : ''}`}>
            {artId || '未生成'}
          </div>
        </div>
      </div>

      <div className="button-group">
        <button
          className={`generate-id-btn ${isGeneratingId ? 'generating' : ''}`}
          onClick={handleGenerateId}
          disabled={isGeneratingId}
        >
          {isGeneratingId ? '生成中...' : '生成唯一ID'}
        </button>

        <button className="save-btn" onClick={handleSave}>
          保存到画廊
        </button>

        <button className="download-btn" onClick={handleDownload}>
          下载PNG
        </button>

        <button
          className={`share-btn ${copied ? 'copied' : ''}`}
          onClick={handleShare}
        >
          {copied ? '✓ 已复制' : '分享作品'}
        </button>
      </div>
    </div>
  );
};

export default ShareBar;
