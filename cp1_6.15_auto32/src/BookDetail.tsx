import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Tag,
  User,
  Mail,
  Heart,
  Star,
} from 'lucide-react';
import type { Book } from './api';
import { api } from './api';
import ExchangeForm from './components/ExchangeForm';

interface BookDetailProps {
  bookId: string;
  onClose: () => void;
}

const BookDetail: React.FC<BookDetailProps> = ({ bookId, onClose }) => {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [showExchangeForm, setShowExchangeForm] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const data = await api.getBook(bookId);
        setBook(data);
      } catch (error) {
        console.error('Failed to fetch book:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [bookId]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 280);
  };

  const handlePrevImage = () => {
    if (!book) return;
    const allImages = [book.coverImage, ...book.images];
    setCurrentImage((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleNextImage = () => {
    if (!book) return;
    const allImages = [book.coverImage, ...book.images];
    setCurrentImage((prev) => (prev + 1) % allImages.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNextImage();
      else handlePrevImage();
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const result = await api.toggleFavorite(bookId);
      setIsFavorite(result.added);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleExchangeSubmit = async (data: {
    type: 'exchange' | 'buy';
    offerBookTitle?: string;
    offerBookAuthor?: string;
    offerPrice?: number;
    message: string;
    contactInfo: string;
  }) => {
    await api.createExchange(bookId, data);
  };

  if (loading || !book) {
    return (
      <div className="slide-in-overlay" onClick={handleClose}>
        <div className="slide-in-backdrop" />
        <div className="slide-in-content flex items-center justify-center">
          <div className="animate-pulse text-wood">加载中...</div>
        </div>
      </div>
    );
  }

  const allImages = [book.coverImage, ...book.images];

  return (
    <>
      <div className="slide-in-overlay" onClick={handleClose}>
        <div className="slide-in-backdrop" />
        <div
          className={`slide-in-content ${isClosing ? 'slide-out' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-cream/90 backdrop-blur-md border-b border-wood/10">
            <button
              onClick={handleClose}
              className="btn-press p-2.5 rounded-xl bg-white shadow-soft hover:bg-creamDark transition-colors text-[#3D2B1F]"
            >
              <X size={22} />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleFavorite}
                className="btn-press p-2.5 rounded-xl bg-white shadow-soft hover:bg-creamDark transition-colors"
              >
                <Heart
                  size={20}
                  className={isFavorite ? 'fill-warmOrange text-warmOrange' : 'text-[#3D2B1F]/70'}
                />
              </button>
            </div>
          </div>

          <div
            className="relative w-full bg-creamDark aspect-[4/3] overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={allImages[currentImage]}
              alt={`${book.title} - 图片 ${currentImage + 1}`}
              className="w-full h-full object-cover transition-opacity duration-300"
              key={currentImage}
              style={{ opacity: 0, animation: 'fadeInUp 0.3s ease-out forwards' }}
            />

            {allImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="btn-press absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 backdrop-blur rounded-full shadow-md hover:bg-white transition-colors"
                >
                  <ChevronLeft size={22} className="text-[#3D2B1F]" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="btn-press absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 backdrop-blur rounded-full shadow-md hover:bg-white transition-colors"
                >
                  <ChevronRight size={22} className="text-[#3D2B1F]" />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImage(idx)}
                      className={`
                        btn-press w-2 h-2 rounded-full transition-all duration-200
                        ${idx === currentImage ? 'bg-warmOrange w-6' : 'bg-white/60 hover:bg-white/90'}
                      `}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="p-6 pb-32">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="inline-block px-3 py-1 bg-warmOrange/10 text-warmOrangeDark rounded-full text-sm font-semibold mb-3">
                  {book.courseCode}
                </span>
                <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#3D2B1F] mb-2 leading-tight">
                  {book.title}
                </h1>
                <p className="text-woodDark text-lg">{book.author}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-creamDark/50 rounded-xl p-4">
                <div className="text-woodDark text-sm mb-1">新旧程度</div>
                <div className="font-semibold text-[#3D2B1F]">{book.condition}</div>
              </div>
              <div className="bg-creamDark/50 rounded-xl p-4">
                <div className="text-woodDark text-sm mb-1">原价</div>
                <div className="font-semibold text-wood line-through">¥{book.originalPrice}</div>
              </div>
            </div>

            {book.expectedPrice !== undefined && (
              <div className="bg-gradient-to-r from-warmOrange/15 to-warmOrange/5 rounded-xl p-5 mb-6">
                <div className="flex items-baseline gap-2">
                  <Tag className="text-warmOrange" size={20} />
                  <span className="text-woodDark font-medium">卖家期望价格</span>
                </div>
                <div className="text-4xl font-bold text-warmOrange mt-2">
                  ¥{book.expectedPrice}
                  <span className="text-lg font-normal text-woodDark ml-2">
                    ({Math.round((1 - book.expectedPrice / book.originalPrice) * 100)}% OFF)
                  </span>
                </div>
              </div>
            )}

            {book.wantExchange && book.wantExchange.length > 0 && (
              <div className="bg-gradient-to-r from-sage/15 to-sage/5 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="text-sage" size={20} />
                  <span className="text-sage font-semibold">想交换以下课本</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {book.wantExchange.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-white rounded-lg text-sm text-sageDark font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-wood/10 pt-6">
              <h2 className="font-serif font-bold text-xl text-[#3D2B1F] mb-4 flex items-center gap-2">
                <User size={20} className="text-wood" />
                卖家信息
              </h2>
              <div className="flex items-start gap-4">
                <img
                  src={book.sellerAvatar}
                  alt={book.sellerName}
                  className="w-14 h-14 rounded-full bg-creamDark shadow-soft"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg text-[#3D2B1F]">{book.sellerName}</h3>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star size={14} className="fill-amber-500" />
                      <span className="text-sm font-medium">4.9</span>
                    </div>
                  </div>
                  <p className="text-woodDark text-sm leading-relaxed mb-3">{book.sellerBio}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={16} className="text-wood" />
                    <span className="text-[#3D2B1F]/80">{book.contactInfo}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 md:left-auto md:right-0 md:max-w-[900px] p-4 bg-gradient-to-t from-cream via-cream/95 to-cream/0 pt-8">
            <button
              onClick={() => setShowExchangeForm(true)}
              className="btn-press w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-warmOrange to-warmOrangeDark text-white rounded-2xl font-bold text-lg shadow-soft hover:shadow-softHover transition-all"
            >
              <RefreshCw size={22} />
              发起交换 / 购买
            </button>
          </div>
        </div>
      </div>

      <ExchangeForm
        isOpen={showExchangeForm}
        onClose={() => setShowExchangeForm(false)}
        bookTitle={book.title}
        hasPrice={book.expectedPrice !== undefined}
        hasExchange={(book.wantExchange?.length || 0) > 0}
        onSubmit={handleExchangeSubmit}
      />
    </>
  );
};

export default BookDetail;
