import React, { memo, useCallback, useState } from 'react';
import dayjs from 'dayjs';
import { X } from 'lucide-react';
import type { TimelineEvent } from '@/types';

interface EventCardProps {
  event: TimelineEvent;
  index: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  isNew?: boolean;
}

const EventCard: React.FC<EventCardProps> = memo(function EventCard({
  event,
  index,
  isExpanded,
  onToggle,
  isNew = false,
}) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleToggle = useCallback(() => {
    onToggle(event.id);
  }, [event.id, onToggle]);

  const handleImageClick = useCallback((image: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewImage(image);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewImage(null);
  }, []);

  const isLeftSide = index % 2 === 0;

  const formattedDate = dayjs(event.date).format('YYYY-MM-DD');

  return (
    <>
      <div
        className={`timeline-item relative flex w-full mb-12 ${
          isLeftSide ? 'justify-start' : 'justify-end'
        } ${isNew ? 'animate-slide-in' : ''}`}
      >
        <div className="timeline-dot absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-400 rounded-full z-10" />



        <div
          className={`event-card relative w-[calc(50%-32px)] bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
            isLeftSide ? 'mr-auto pr-8' : 'ml-auto pl-8'
          }`}
          onClick={handleToggle}
        >
          <div
            className={`absolute top-6 w-0 h-0 border-t-8 border-b-8 border-y-transparent ${
              isLeftSide
                ? 'right-0 border-l-8 border-l-white'
                : 'left-0 border-r-8 border-r-white'
            }`}
          />

          <div className="event-date text-gray-700 font-bold text-sm mb-2">
            {formattedDate}
          </div>

          <h3 className="event-title text-xl font-bold text-gray-800 mb-3">
            {event.title}
          </h3>

          <p className="event-summary text-gray-600 text-sm leading-relaxed">
            {event.summary.length > 100
              ? `${event.summary.slice(0, 100)}...`
              : event.summary}
          </p>

          <div
            className={`event-details overflow-hidden transition-all duration-400 ease-in-out ${
              isExpanded
                ? 'max-h-[1000px] opacity-100 mt-4'
                : 'max-h-0 opacity-0'
            }`}
            style={{
              transitionProperty: 'max-height, opacity',
            }}
          >
            <p className="event-description text-gray-700 leading-relaxed mb-4">
              {event.description}
            </p>

            {event.images.length > 0 && (
              <div className="event-images flex gap-3 flex-wrap">
                {event.images.map((image, imgIndex) => (
                  <img
                    key={imgIndex}
                    src={image}
                    alt={`${event.title} ${imgIndex + 1}`}
                    className="w-24 h-24 object-cover rounded-lg cursor-pointer transition-transform duration-200 hover:scale-105"
                    onClick={(e) => handleImageClick(image, e)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="expand-indicator mt-3 text-gray-400 text-xs">
            {isExpanded ? '点击收起 ↑' : '点击展开 ↓'}
          </div>
        </div>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={closePreview}
        >
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors"
            onClick={closePreview}
          >
            <X size={32} />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
});

export default EventCard;
