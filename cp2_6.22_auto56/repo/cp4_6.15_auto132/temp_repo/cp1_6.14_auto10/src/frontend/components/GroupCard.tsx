import React from 'react';
import { Users } from 'lucide-react';
import { Group } from '../utils/apiClient';
import { useNavigate } from 'react-router-dom';

interface GroupCardProps {
  group: Group;
}

export default function GroupCard({ group }: GroupCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/groups/${group.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={group.coverImage}
          alt={group.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">
          {group.name}
        </h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2 h-10">
          {group.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users size={16} className="text-primary-500" />
            <span>{group.memberCount} 成员</span>
          </div>
          <span className="text-sm text-gray-400">组长: {group.leaderName}</span>
        </div>
      </div>
    </div>
  );
}
