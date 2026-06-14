import { Github, Twitter, Instagram, Music } from 'lucide-react'

const socialLinks = [
  { icon: Github, label: 'GitHub' },
  { icon: Twitter, label: 'Twitter' },
  { icon: Instagram, label: 'Instagram' },
  { icon: Music, label: 'Music' },
]

export default function Footer() {
  return (
    <footer className="border-t border-gray-700/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md gradient-bg flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-semibold gradient-text">SoundForge</span>
          </div>
          <p className="text-gray-400 text-sm">&copy; 2026 SoundForge. 保留所有权利。</p>
          <div className="flex items-center gap-4">
            {socialLinks.map(({ icon: Icon, label }) => (
              <button
                key={label}
                className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 hover:animate-spin-reverse"
                title={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
