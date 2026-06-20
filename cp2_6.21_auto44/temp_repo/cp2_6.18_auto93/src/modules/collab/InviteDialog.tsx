import React, { useState } from 'react';
import { X, Users, Copy, Check, Mail, Shield } from 'lucide-react';
import { usePrototypeStore } from '../../stores/prototypeStore';
import type { MemberRole } from '../../types';
import { generateId } from '../../utils/helpers';

interface InviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const roleLabels: Record<MemberRole, string> = {
  owner: '所有者',
  editor: '编辑',
  commenter: '评论',
  viewer: '查看',
};

const roleDescriptions: Record<MemberRole, string> = {
  owner: '完全控制项目',
  editor: '可编辑原型内容',
  commenter: '可查看和评论',
  viewer: '仅只读预览',
};

export const InviteDialog: React.FC<InviteDialogProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const { members, addMember, updateMember, removeMember } = usePrototypeStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('editor');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'invite' | 'members'>('invite');

  const projectMembers = members.filter((m) => m.projectId === projectId);
  const inviteToken = generateId().slice(0, 12);
  const inviteLink = `${window.location.origin}/invite/${inviteToken}`;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    addMember(projectId, email.trim(), role);
    setEmail('');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-scaleIn overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">团队协作</h2>
              <p className="text-xs text-slate-500">邀请成员加入项目</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'invite'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            邀请成员
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'members'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            成员列表 ({projectMembers.length})
          </button>
        </div>

        <div className="p-5 max-h-96 overflow-y-auto">
          {activeTab === 'invite' ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  邀请链接
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 font-mono truncate">
                    {inviteLink}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-sm text-slate-400">或</span>
                </div>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Mail size={14} className="inline mr-1" />
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="输入成员邮箱"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Shield size={14} className="inline mr-1" />
                    权限设置
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['editor', 'commenter', 'viewer'] as MemberRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          role === r
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-medium text-sm text-slate-800">
                          {roleLabels[r]}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {roleDescriptions[r]}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!email.trim()}
                  className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  发送邀请
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-2">
              {projectMembers.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Users size={40} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无成员</p>
                </div>
              ) : (
                projectMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {member.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">
                          {member.email}
                        </div>
                        <div className="text-xs text-slate-500">
                          {roleLabels[member.role]}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.role !== 'owner' && (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) =>
                              updateMember(member.id, e.target.value as MemberRole)
                            }
                            className="text-xs px-2 py-1 border border-slate-300 rounded-md bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <option value="editor">编辑</option>
                            <option value="commenter">评论</option>
                            <option value="viewer">查看</option>
                          </select>
                          <button
                            onClick={() => removeMember(member.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
