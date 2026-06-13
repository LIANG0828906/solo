import React, { useState, useEffect } from 'react';
import { getAllCards, deleteCard, clearAllCards } from '../utils/storage';

interface SavedCard {
  id: string;
  imageData: string;
  createdAt: number;
}

export default function Gallery() {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<SavedCard | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const loadCards = async () => {
    try {
      const allCards = await getAllCards();
      const sortedCards = allCards.sort((a, b) => b.createdAt - a.createdAt);
      setCards(sortedCards);
    } catch (error) {
      console.error('加载卡片失败:', error);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteCard(id);
      setCards(cards.filter(card => card.id !== id));
      if (selectedCard?.id === id) {
        setSelectedCard(null);
      }
      showToastMessage('卡片已删除');
    } catch (error) {
      console.error('删除失败:', error);
      showToastMessage('删除失败，请重试');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('确定要清空所有卡片吗？此操作不可撤销。')) {
      return;
    }

    try {
      await clearAllCards();
      setCards([]);
      setSelectedCard(null);
      showToastMessage('所有卡片已清空');
    } catch (error) {
      console.error('清空失败:', error);
      showToastMessage('清空失败，请重试');
    }
  };

  const handleDownload = (card: SavedCard) => {
    const link = document.createElement('a');
    link.href = card.imageData;
    link.download = `ideacard-${new Date(card.createdAt).toISOString().slice(0, 10)}.png`;
    link.click();
    showToastMessage('图片已开始下载');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">我的画廊</h1>
        {cards.length > 0 && (
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            onClick={handleClearAll}
          >
            清空所有
          </button>
        )}
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-400 text-lg mb-4">还没有保存任何卡片</div>
          <p className="text-gray-500">去创建一张灵感卡片吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
              onClick={() => setSelectedCard(card)}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={card.imageData}
                  alt="保存的卡片"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600">{formatDate(card.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCard && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="mb-4 flex gap-4 flex-wrap">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  onClick={() => handleDownload(selectedCard)}
                >
                  下载图片
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  onClick={() => handleDelete(selectedCard.id)}
                >
                  删除
                </button>
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  onClick={() => setSelectedCard(null)}
                >
                  关闭
                </button>
              </div>
              <img
                src={selectedCard.imageData}
                alt="大图预览"
                className="w-full h-auto rounded-lg"
              />
              <p className="mt-4 text-center text-gray-600 text-sm">
                {formatDate(selectedCard.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up z-50">
          {toastMessage}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
