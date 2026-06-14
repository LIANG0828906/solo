import { useState } from 'react'
import { X, Users, Send } from 'lucide-react'
import type { Song } from '@/types'
import MixingConsole from './MixingConsole'

interface CollabModalProps {
  song: Song
  onClose: () => void
}

export default function CollabModal({ song, onClose }: CollabModalProps) {
  const [step, setStep] = useState<'invite' | 'room'>('invite')
  const [inviteName, setInviteName] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')

  const handleSubmitInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (inviteName.trim()) {
      setStep('room')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="glass-modal p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors btn-press z-10">
          <X className="w-5 h-5" />
        </button>

        {step === 'invite' ? (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-3">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">发起合作</h3>
              <p className="text-gray-400 text-sm mt-1">邀请其他音乐人一起混音「{song.title}」</p>
            </div>

            <form onSubmit={handleSubmitInvite} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">受邀音乐人昵称</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="输入音乐人昵称"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-violet/50 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">邀请信息</label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="描述你的合作想法..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-violet/50 transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl gradient-bg text-white font-semibold btn-press hover:shadow-lg hover:shadow-brand-indigo/30 transition-all duration-300"
              >
                <span className="flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  发送邀请
                </span>
              </button>
            </form>
          </>
        ) : (
          <MixingConsole song={song} collaboratorName={inviteName} />
        )}
      </div>
    </div>
  )
}
