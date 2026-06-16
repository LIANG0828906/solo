import { ReactNode, MouseEvent } from 'react';
import './Card.css';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

const Card = ({ children, className = '', hoverable = false, onClick }: CardProps) => {
  const cardClass = `card ${hoverable ? 'card-hoverable' : ''} ${className}`;

  return (
    <div className={cardClass.trim()} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;
