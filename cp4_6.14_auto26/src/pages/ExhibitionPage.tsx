import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VariableSizeGrid as Grid } from 'react-window';
import { Plus, AlertCircle } from 'lucide-react';
import { useGalleryStore } from '@/store/galleryStore';
import { ArtworkCard } from '@/components/ArtworkCard';
import { ArtworkModal } from '@/components/ArtworkModal';
import { CreateArtworkModal } from '@/components/CreateArtworkModal';
import type { Artwork, Exhibition } from '@/data/mockData';
import { MAX_ARTWORKS_PER_EXHIBITION } from '@/data/mockData';

function useResponsiveColumns() {
  const getColumns = useCallback((): number => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    if (w < 480) return 1;
    if (w < 768) return 2;
    if (w < 1200) return 3;
    return 4;
  }, []);

  const [columns, setColumns] = useState(getColumns);

  useMemo(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setColumns(getColumns());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [getColumns]);

  return columns;
}

export function ExhibitionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const columns = useResponsiveColumns();

  const getExhibitionById = useGalleryStore((s) => s.getExhibitionById);
  const getArtworksByExhibition = useGalleryStore((s) => s.getArtworksByExhibition);
  const getCommentsByArtwork = useGalleryStore((s) => s.getCommentsByArtwork);
  const addArtwork = useGalleryStore((s) => s.addArtwork);
  const addComment = useGalleryStore((s) => s.addComment);

  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [createArtworkOpen, setCreateArtworkOpen] = useState(false);

  const exhibition: Exhibition | undefined = id ? getExhibitionById(id) : undefined;
  const artworks: Artwork[] = id ? getArtworksByExhibition(id) : [];

  const selectedComments = selectedArtwork
    ? getCommentsByArtwork(selectedArtwork.id)
    : [];

  const handleAddArtwork = (data: {
    title: string;
    artist: string;
    description: string;
    imageUrl: string;
  }) => {
    if (!id) return;
    addArtwork({ ...data, exhibitionId: id });
    setCreateArtworkOpen(false);
  };

  const handleAddComment = (data: { artworkId: string; username: string; content: string }) => {
    addComment(data);
  };

  if (!exhibition) {
    return (
      <div className="exhibition-page">
        <div className="container">
          <div className="empty-state" style={{ marginTop: 120 }}>
            <AlertCircle size={64} className="text-gray-400" />
            <h3 className="empty-state__title">展厅不存在</h3>
            <p className="empty-state__desc">该展厅可能已被删除或链接无效</p>
            <button className="btn btn--primary mt-6" onClick={() => navigate('/')}>
              返回展厅列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canAddArtwork = artworks.length < MAX_ARTWORKS_PER_EXHIBITION;
  const gap = 24;
  const cardWidth = typeof window !== 'undefined'
    ? Math.min(1200 - (columns - 1) * gap, window.innerWidth - 48) / columns
    : 282;
  const cardHeight = cardWidth * 1.15 + 68;

  const rowCount = Math.ceil(artworks.length / columns);

  const getColumnWidth = () => cardWidth + gap;
  const getRowHeight = () => cardHeight + gap;

  const Cell = ({
    columnIndex,
    rowIndex,
    style,
  }: {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
  }) => {
    const index = rowIndex * columns + columnIndex;
    const artwork = artworks[index];
    if (!artwork) return null;

    return (
      <div
        style={{
          ...style,
          left: Number(style.left) + gap / 2,
          top: Number(style.top) + gap / 2,
          width: cardWidth,
          height: cardHeight,
        }}
      >
        <ArtworkCard
          artwork={artwork}
          onSelect={setSelectedArtwork}
        />
      </div>
    );
  };

  return (
    <div className="exhibition-page">
      <header className="exhibition-hero">
        <div className="exhibition-hero__cover">
          <img
            src={exhibition.coverUrl}
            alt={exhibition.name}
            className="exhibition-hero__cover-img"
          />
          <div className="exhibition-hero__overlay" />
        </div>
        <div className="container exhibition-hero__content">
          <h1 className="exhibition-hero__title">{exhibition.name}</h1>
          <p className="exhibition-hero__theme">{exhibition.theme}</p>
          <div className="exhibition-hero__stats">
            <span>{artworks.length} / {MAX_ARTWORKS_PER_EXHIBITION} 件作品</span>
          </div>
        </div>
      </header>

      <section className="exhibition-section">
        <div className="container">
          <div className="exhibition-toolbar">
            <h2 className="exhibition-toolbar__title">展厅作品</h2>
            <button
              className={`btn ${canAddArtwork ? 'btn--primary' : 'btn--disabled'}`}
              onClick={() => canAddArtwork && setCreateArtworkOpen(true)}
              disabled={!canAddArtwork}
              title={!canAddArtwork ? `最多展示${MAX_ARTWORKS_PER_EXHIBITION}件作品` : ''}
            >
              <Plus size={16} />
              添加作品
            </button>
          </div>

          {artworks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🖼️</div>
              <h3 className="empty-state__title">展厅尚无作品</h3>
              <p className="empty-state__desc">
                点击"添加作品"按钮，开始为您的展厅添加艺术作品
              </p>
              <button
                className="btn btn--primary mt-6"
                onClick={() => setCreateArtworkOpen(true)}
                disabled={!canAddArtwork}
              >
                <Plus size={16} /> 添加第一件作品
              </button>
            </div>
          ) : (
            <div
              className="artwork-grid-wrapper"
              style={{
                height: rowCount * getRowHeight() + gap,
                width: '100%',
              }}
            >
              <Grid
                columnCount={columns}
                columnWidth={getColumnWidth}
                rowCount={rowCount}
                rowHeight={getRowHeight}
                width={columns * getColumnWidth()}
                height={rowCount * getRowHeight() + 40}
                itemData={{}}
                overscanRowCount={2}
                overscanColumnCount={0}
                style={{ overflow: 'visible', width: '100% !important' }}
              >
                {Cell}
              </Grid>
            </div>
          )}
        </div>
      </section>

      <ArtworkModal
        artwork={selectedArtwork}
        comments={selectedComments}
        onClose={() => setSelectedArtwork(null)}
        onAddComment={handleAddComment}
      />

      <CreateArtworkModal
        open={createArtworkOpen}
        onClose={() => setCreateArtworkOpen(false)}
        onSubmit={handleAddArtwork}
      />
    </div>
  );
}
