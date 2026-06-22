import React from 'react';
import './FlavorTags.css';

const FLAVOR_CATEGORIES: Record<string, { bg: string; text: string }> = {
  果酸: { bg: '#F8BBD0', text: '#880E4F' },
  花香: { bg: '#E1BEE7', text: '#4A148C' },
  坚果: { bg: '#FFF9C4', text: '#F57F17' },
  巧克力: { bg: '#BCAAA4', text: '#3E2723' },
  焦糖: { bg: '#FFE0B2', text: '#E65100' },
  柑橘: { bg: '#FFCCBC', text: '#BF360C' },
  莓果: { bg: '#F8BBD0', text: '#880E4F' },
  热带: { bg: '#C8E6C9', text: '#1B5E20' },
  香料: { bg: '#D7CCC8', text: '#3E2723' },
  草本: { bg: '#C8E6C9', text: '#1B5E20' },
};

const getCategoryStyle = (flavor: string) => {
  for (const [category, style] of Object.entries(FLAVOR_CATEGORIES)) {
    if (flavor.includes(category)) {
      return style;
    }
  }
  return { bg: '#D4A574', text: '#5C3A21' };
};

interface FlavorTagsProps {
  flavors: string[];
}

const FlavorTags: React.FC<FlavorTagsProps> = ({ flavors }) => {
  return (
    <div className="flavor-tags">
      {flavors.map((flavor, index) => {
        const style = getCategoryStyle(flavor);
        return (
          <span
            key={flavor}
            className="flavor-tag"
            style={{
              backgroundColor: style.bg,
              color: style.text,
              animationDelay: `${index * 0.05}s`,
            }}
          >
            {flavor}
          </span>
        );
      })}
    </div>
  );
};

export default FlavorTags;
