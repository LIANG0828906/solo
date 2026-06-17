import { useState } from 'react';

const imageUrls = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20mountain%20landscape%20with%20sunset&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ocean%20waves%20on%20sandy%20beach&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=city%20skyline%20at%20night%20with%20lights&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=forest%20path%20in%20autumn%20colors&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20architecture%20building&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=colorful%20flowers%20in%20garden&image_size=square',
];

export function PageB() {
  const [search, setSearch] = useState('');

  const handleClear = () => {
    setSearch('');
  };

  return (
    <div className="page-b">
      <h1 style={{ color: '#2C3E50', fontSize: '28px', fontWeight: 600, marginBottom: '20px' }}>
        页面 B - 图片网格与搜索
      </h1>

      <div
        className="card"
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ color: '#2C3E50', fontSize: '20px', marginBottom: '16px' }}>搜索</h2>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <input
            name="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索..."
            style={{
              width: '100%',
              padding: '10px 40px 10px 14px',
              borderRadius: '8px',
              border: '1px solid #BDC3C7',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3498DB';
              e.target.style.boxShadow = '0 0 0 3px #3498DB40';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#BDC3C7';
              e.target.style.boxShadow = 'none';
            }}
          />
          {search && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#95A5A6',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '0 6px',
                lineHeight: 1,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.color = '#E74C3C';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.color = '#95A5A6';
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div
        className="card"
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          padding: '24px',
        }}
      >
        <h2 style={{ color: '#2C3E50', fontSize: '20px', marginBottom: '20px' }}>图片画廊</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {imageUrls.map((url, index) => (
            <div
              key={index}
              style={{
                width: '100%',
                height: '200px',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
              }}
            >
              <img
                src={url}
                alt={`图片 ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PageB;
