import { useState, useEffect, useRef } from 'react';
import { Diary, formatDate, getEmotionName, stripHtml } from './utils';
import RadarChart from './RadarChart';

interface DiaryDetailProps {
  diary: Diary;
}

export default function DiaryDetail({ diary }: DiaryDetailProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const contentRef = useRef(stripHtml(diary.content));

  useEffect(() => {
    const plainText = stripHtml(diary.content);
    contentRef.current = plainText;
    setDisplayedContent('');
    setIsTyping(true);

    let index = 0;
    const speed = 30;

    const typeNextChar = () => {
      if (index < plainText.length) {
        setDisplayedContent(plainText.slice(0, index + 1));
        index++;
        setTimeout(typeNextChar, speed);
      } else {
        setIsTyping(false);
      }
    };

    const timer = setTimeout(typeNextChar, 100);
    return () => clearTimeout(timer);
  }, [diary.id, diary.content]);

  const renderContent = () => {
    const paragraphs = displayedContent.split('\n').filter(p => p.trim());
    return paragraphs.map((p, i) => (
      <p key={i}>{p}</p>
    ));
  };

  return (
    <div className="detail-view">
      <div className="emotion-block">
        <div
          className="emotion-block-inner"
          style={{ backgroundColor: diary.emotionColor }}
        />
        <div className="emotion-block-label">
          {getEmotionName(diary.emotionColor)}
        </div>
        <div className="emotion-block-date">{formatDate(diary.date)}</div>
      </div>

      <div className="detail-content">
        <h1 className="detail-title">{diary.title}</h1>
        <div className="detail-body">
          {renderContent()}
          {isTyping && <span className="typewriter-cursor" />}
        </div>
      </div>

      <div className="sentiment-section">
        <span className="sentiment-label">情感分析</span>
        <RadarChart data={diary.sentiment} />
        <div className="sentiment-bars">
          <div className="sentiment-bar-row">
            <span className="sentiment-bar-label">正面</span>
            <div className="sentiment-bar-track">
              <div
                className="sentiment-bar-fill positive"
                style={{ width: `${diary.sentiment.positive * 100}%` }}
              />
            </div>
            <span className="sentiment-bar-value">
              {Math.round(diary.sentiment.positive * 100)}%
            </span>
          </div>
          <div className="sentiment-bar-row">
            <span className="sentiment-bar-label">中性</span>
            <div className="sentiment-bar-track">
              <div
                className="sentiment-bar-fill neutral"
                style={{ width: `${diary.sentiment.neutral * 100}%` }}
              />
            </div>
            <span className="sentiment-bar-value">
              {Math.round(diary.sentiment.neutral * 100)}%
            </span>
          </div>
          <div className="sentiment-bar-row">
            <span className="sentiment-bar-label">负面</span>
            <div className="sentiment-bar-track">
              <div
                className="sentiment-bar-fill negative"
                style={{ width: `${diary.sentiment.negative * 100}%` }}
              />
            </div>
            <span className="sentiment-bar-value">
              {Math.round(diary.sentiment.negative * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
