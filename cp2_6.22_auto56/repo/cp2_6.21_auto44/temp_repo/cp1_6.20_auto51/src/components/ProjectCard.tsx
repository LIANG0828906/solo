import React, { useState } from 'react';
import { Users, Palette, MessageSquare, ChevronRight, Plus, X, Send } from 'lucide-react';
import type { Project, Palette, Comment } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CommentBubble } from './CommentBubble';

interface ProjectCardProps {
  project: Project;
  palettes: Palette[];
  onInvite: (email: string) => void;
  onAddComment: (paletteId: string | undefined, colorIndex: number | undefined, content: string) => void;
  onAddPalette: (paletteId: string) => void;
  availablePalettes: Palette[];
  currentUserEmail: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  palettes,
  onInvite,
  onAddComment,
  onAddPalette,
  availablePalettes,
  currentUserEmail
}) => {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showAddPalette, setShowAddPalette] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedPaletteForComment, setSelectedPaletteForComment] = useState<string | undefined>();
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | undefined>();

  const handleInvite = () => {
    if (inviteEmail.trim()) {
      onInvite(inviteEmail.trim());
      setInviteEmail('');
      setShowInvite(false);
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(selectedPaletteForComment, selectedColorIndex, newComment.trim());
      setNewComment('');
      setSelectedPaletteForComment(undefined);
      setSelectedColorIndex(undefined);
    }
  };

  const projectPalettes = palettes.filter(p => project.palettes.includes(p.id));
  const commentsByPalette: Record<string, Comment[]> = {};
  const generalComments: Comment[] = [];

  project.comments.forEach(comment => {
    if (comment.paletteId) {
      if (!commentsByPalette[comment.paletteId]) {
        commentsByPalette[comment.paletteId] = [];
      }
      commentsByPalette[comment.paletteId].push(comment);
    } else {
      generalComments.push(comment);
    }
  });

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{project.name}</h3>
            {project.description && (
              <p className="text-sm text-gray-500 mt-1">{project.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              创建于 {format(new Date(project.createdAt), 'yyyy年MM月dd日', { locale: zhCN })}
            </p>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </div>

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Users size={16} />
            <span>{project.members.length} 位成员</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Palette size={16} />
            <span>{projectPalettes.length} 个方案</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <MessageSquare size={16} />
            <span>{project.comments.length} 条评论</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {project.members.map((member) => (
            <div 
              key={member.id}
              className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-full text-xs"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
              <span className="text-gray-700">{member.email}</span>
              <span className="text-gray-400">({member.role === 'owner' ? '所有者' : member.role === 'editor' ? '编辑者' : '查看者'})</span>
            </div>
          ))}
          
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-1 px-2 py-1 border-2 border-dashed border-gray-300 rounded-full text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            <Plus size={14} />
            邀请成员
          </button>
        </div>

        {showInvite && (
          <div className="flex gap-2 mb-4 p-3 bg-blue-50 rounded-lg animate-expandDown">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="输入邮箱地址..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
            <button
              onClick={handleInvite}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              邀请
            </button>
            <button
              onClick={() => setShowInvite(false)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {projectPalettes.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">共享的配色方案</h4>
            <div className="space-y-2">
              {projectPalettes.map((palette) => (
                <div 
                  key={palette.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPaletteForComment === palette.id 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                  onClick={() => setSelectedPaletteForComment(
                    selectedPaletteForComment === palette.id ? undefined : palette.id
                  )}
                >
                  <div className="flex h-10 rounded-lg overflow-hidden mb-2">
                    {palette.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 transition-all ${
                          selectedColorIndex === idx && selectedPaletteForComment === palette.id
                            ? 'ring-2 ring-offset-2 ring-blue-400 scale-105'
                            : ''
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedPaletteForComment === palette.id) {
                            setSelectedColorIndex(selectedColorIndex === idx ? undefined : idx);
                          } else {
                            setSelectedPaletteForComment(palette.id);
                            setSelectedColorIndex(idx);
                          }
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-gray-700">{palette.name}</p>
                  
                  {commentsByPalette[palette.id] && (
                    <div className="mt-3 space-y-3 pt-3 border-t">
                      {commentsByPalette[palette.id].map((comment) => (
                        <CommentBubble
                          key={comment.id}
                          comment={comment}
                          paletteColors={palette.colors}
                          onColorClick={(idx) => setSelectedColorIndex(idx)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowAddPalette(!showAddPalette)}
          className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors mb-4"
        >
          + 添加配色方案到项目
        </button>

        {showAddPalette && (
          <div className="p-3 bg-gray-50 rounded-lg mb-4 animate-expandDown">
            <p className="text-xs text-gray-500 mb-2">选择要添加的方案：</p>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {availablePalettes
                .filter(p => !project.palettes.includes(p.id))
                .slice(0, 10)
                .map((palette) => (
                  <button
                    key={palette.id}
                    onClick={() => {
                      onAddPalette(palette.id);
                      setShowAddPalette(false);
                    }}
                    className="p-2 bg-white rounded-lg border border-gray-200 hover:border-blue-400 transition-colors text-left"
                  >
                    <div className="flex h-6 rounded overflow-hidden mb-1">
                      {palette.colors.slice(0, 5).map((color, idx) => (
                        <div key={idx} className="flex-1" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{palette.name}</p>
                  </button>
                ))}
            </div>
          </div>
        )}

        {generalComments.length > 0 && (
          <div className="mb-4 space-y-3">
            <h4 className="text-sm font-medium text-gray-700">项目讨论</h4>
            {generalComments.map((comment) => (
              <CommentBubble key={comment.id} comment={comment} />
            ))}
          </div>
        )}

        <div className="flex gap-2 p-3 bg-gray-50 rounded-lg">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              selectedPaletteForComment 
                ? selectedColorIndex !== undefined
                  ? '针对该色块发表评论...'
                  : '针对该方案发表评论...'
                : '发表评论...'
            }
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>

        {(selectedPaletteForComment || selectedColorIndex !== undefined) && (
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            {selectedPaletteForComment && (
              <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded">
                已关联方案
              </span>
            )}
            {selectedColorIndex !== undefined && (
              <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded">
                已标注色块 #{selectedColorIndex + 1}
              </span>
            )}
            <button
              onClick={() => {
                setSelectedPaletteForComment(undefined);
                setSelectedColorIndex(undefined);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
