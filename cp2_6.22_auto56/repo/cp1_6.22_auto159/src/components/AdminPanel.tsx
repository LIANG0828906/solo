import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchArtworks, uploadArtwork } from '../utils/api';

interface Artwork {
  id: string;
  title: string;
  dimensions: string;
  year: number;
  imageBase64: string;
  likes: number;
  commentCount: number;
}

const AdminPanel: React.FC = () => {
  const [title, setTitle] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [year, setYear] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadArtworks = useCallback(async () => {
    try {
      const data = await fetchArtworks();
      setArtworks(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadArtworks();
  }, [loadArtworks]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && /\.(jpe?g|png)$/i.test(droppedFile.name)) {
      setFile(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Please enter a title' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('dimensions', dimensions.trim());
      formData.append('year', year);

      await uploadArtwork(formData);
      setMessage({ type: 'success', text: 'Artwork uploaded successfully!' });
      setTitle('');
      setDimensions('');
      setYear('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      loadArtworks();
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload artwork' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        padding: '32px',
        marginBottom: '32px',
      }}>
        <h2 style={{ color: '#1A1A1A', marginTop: 0, marginBottom: '24px' }}>Upload Artwork</h2>

        <form onSubmit={handleSubmit}>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#6366F1' : '#6366F1'}`,
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: dragOver ? '#f0f0ff' : '#fafafa',
              marginBottom: '20px',
              transition: 'background-color 0.2s',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6366F1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginBottom: '12px' }}
            >
              <path d="M12 16V4M12 4L8 8M12 4L16 8" />
              <path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" />
            </svg>
            <p style={{ color: '#6366F1', margin: 0, fontSize: '15px' }}>
              {file ? file.name : '将图片拖到此处'}
            </p>
            <p style={{ color: '#999', margin: '4px 0 0', fontSize: '13px' }}>
              Supports .jpg, .jpeg, .png
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', color: '#555', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Artwork title"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#1A1A1A',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#555', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>
                Dimensions
              </label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="宽x高 厘米"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#1A1A1A',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#555', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#1A1A1A',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {message && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: message.type === 'success' ? '#065f46' : '#991b1b',
            }}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '12px 32px',
              backgroundColor: submitting ? '#999' : '#6366F1',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {submitting ? 'Uploading...' : 'Upload Artwork'}
          </button>
        </form>
      </div>

      <h2 style={{ color: '#E0E0E0', marginBottom: '16px' }}>Uploaded Artworks</h2>
      {artworks.length === 0 ? (
        <p style={{ color: '#888' }}>No artworks uploaded yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {artworks.map((artwork) => (
            <div
              key={artwork.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                backgroundColor: '#2a2a2a',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              {artwork.imageBase64 && (
                <img
                  src={artwork.imageBase64}
                  alt={artwork.title}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', color: '#E0E0E0', fontSize: '16px' }}>
                  {artwork.title}
                </h3>
                <p style={{ margin: 0, color: '#999', fontSize: '13px' }}>
                  {artwork.dimensions} &middot; {artwork.year}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
                <span style={{ color: '#E0E0E0', fontSize: '14px' }}>
                  ❤️ {artwork.likes}
                </span>
                <span style={{ color: '#E0E0E0', fontSize: '14px' }}>
                  💬 {artwork.commentCount}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
