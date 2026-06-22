import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Recommendation } from '../store';

interface RecommendCardProps {
  recommendation: Recommendation;
}

const RecommendCard: React.FC<RecommendCardProps> = ({ recommendation }) => {
  const navigate = useNavigate();
  const { book, similarity } = recommendation;

  const handleClick = () => {
    navigate(`/book/${book.id}`);
  };

  return (
    <div className="recommend-card" onClick={handleClick}>
      <h4 className="recommend-book-title">{book.title}</h4>
      <p className="recommend-book-author">作者：{book.author}</p>
      <div className="similarity-bar-container">
        <div
          className="similarity-bar"
          style={{ animationDelay: '0.1s', width: `${similarity}%` }}
        />
      </div>
      <p className="similarity-text">匹配度 {similarity}%</p>
    </div>
  );
};

export default RecommendCard;
