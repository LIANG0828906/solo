import TrackEditor from '@/components/TrackEditor';

export default function EditorPage() {
  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-3xl font-bold mb-2"
          style={{
            color: 'var(--neon-cyan)',
            textShadow: '0 0 20px rgba(0, 245, 212, 0.5)',
          }}
        >
          赛道编辑器
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          创建属于你的专属赛道，挑战自我极限！
        </p>
      </div>

      <TrackEditor />
    </div>
  );
}
