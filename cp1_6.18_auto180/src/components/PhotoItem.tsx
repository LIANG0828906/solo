import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Photo } from '../stores/plantStore';
import { usePlantStore } from '../stores/plantStore';
import './PhotoItem.css';

interface PhotoItemProps {
  photo: Photo;
}

export default function PhotoItem({ photo }: PhotoItemProps) {
  const [loaded, setLoaded] = useState(false);
  const deletePhoto = usePlantStore(s => s.deletePhoto);

  return (
    <div className="photo-item">
      <div className="photo-wrap">
        {!loaded && <div className="photo-shimmer" />}
        <img
          src={photo.url}
          alt=""
          className={`photo-img ${loaded ? 'loaded' : ''}`}
          onLoad={() => setLoaded(true)}
          loading="lazy"
        />
        <button
          className="photo-delete"
          onClick={() => deletePhoto(photo.id)}
          aria-label="删除照片"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {photo.note && <p className="photo-note">{photo.note}</p>}
      <div className="photo-date">{new Date(photo.createdAt).toLocaleDateString('zh-CN')}</div>
    </div>
  );
}
