import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        paddingTop: '120px',
        paddingBottom: '80px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 32px',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '80px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              background: 'rgba(99, 102, 241, 0.08)',
              borderRadius: '100px',
              fontSize: '14px',
              color: '#6366F1',
              fontWeight: 500,
              marginBottom: '24px',
            }}
          >
            <span>✨</span>
            <span>全新虚拟艺术体验</span>
          </div>

          <h1
            style={{
              fontSize: '64px',
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: '24px',
              letterSpacing: '-1.5px',
              background: 'linear-gradient(135deg, #1A1A1A 0%, #6366F1 50%, #EC4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            打造属于你的<br />
            3D 虚拟艺术馆
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: '#666',
              maxWidth: '600px',
              margin: '0 auto 40px',
              lineHeight: 1.8,
            }}
          >
            ArtVault 让每一位艺术家和收藏家都能在线创建沉浸式的 3D 展览空间，
            布置作品、邀请好友参观、分享灵感与感动。
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            <Link
              to="/galleries"
              style={{
                padding: '16px 36px',
                borderRadius: '100px',
                background: '#1A1A1A',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 500,
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(26, 26, 26, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#333'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(26, 26, 26, 0.35)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1A1A1A'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(26, 26, 26, 0.3)'
              }}
            >
              探索展厅广场 →
            </Link>
            <Link
              to="/auth?mode=register"
              style={{
                padding: '16px 36px',
                borderRadius: '100px',
                background: '#fff',
                color: '#1A1A1A',
                fontSize: '16px',
                fontWeight: 500,
                transition: 'all 0.3s ease',
                border: '1px solid #e5e5e5',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fafafa'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              创建我的艺术馆
            </Link>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            marginBottom: '80px',
          }}
        >
          {[
            { icon: '🖼️', title: '沉浸式 3D 展厅', desc: '四面墙体立体展示，自由拖拽旋转视角，身临其境的观展体验。' },
            { icon: '🎨', title: '自由布置作品', desc: '拖拽摆放、自由缩放，打造专属的展览空间，每一处细节都由你定义。' },
            { icon: '💬', title: '社交互动留言', desc: '邀请好友参观，在每幅作品下留言点赞，交流艺术灵感与心得。' },
          ].map((feat, i) => (
            <div
              key={i}
              style={{
                padding: '32px',
                background: '#fff',
                borderRadius: '20px',
                border: '1px solid #f0f0f0',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>{feat.icon}</div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '10px', color: '#1A1A1A' }}>{feat.title}</h3>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.8 }}>{feat.desc}</p>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '32px',
            padding: '48px',
            background: 'linear-gradient(135deg, #fafbff 0%, #fff5fa 100%)',
            borderRadius: '28px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.5px' }}>
              为创作而生，为艺术而造
            </h2>
            <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.8, marginBottom: '24px' }}>
              无论你是专业艺术家、数字绘画爱好者，还是刚刚拿起画笔的初学者，
              ArtVault 都能为你的作品提供最完美的展示舞台。
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                '支持 JPG / PNG / WebP 格式上传，单张最大 5MB',
                '自动压缩优化，兼顾画质与加载速度',
                '本地 IndexedDB 存储，数据安全可靠',
                '10 种精选主题配色，一键切换展厅风格',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#10B981', fontSize: '18px' }}>✓</span>
                  <span style={{ fontSize: '14px', color: '#444' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                width: '380px',
                height: '280px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(102, 126, 234, 0.35)',
              }}
            >
              <div style={{ position: 'absolute', fontSize: '120px', opacity: 0.15, top: '-20px', right: '-10px' }}>🎨</div>
              <div style={{ position: 'absolute', fontSize: '80px', opacity: 0.12, bottom: '10px', left: '0px' }}>🖼️</div>
              <div style={{ textAlign: 'center', color: '#fff', zIndex: 1 }}>
                <div style={{ fontSize: '72px', marginBottom: '12px' }}>🏛️</div>
                <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>ArtVault Gallery</div>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>沉浸式虚拟艺术馆</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
