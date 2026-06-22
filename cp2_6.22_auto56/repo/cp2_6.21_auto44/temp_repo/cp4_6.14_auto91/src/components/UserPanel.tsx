import { Link } from 'react-router-dom'
import type { Recipe } from '../types'
import Skeleton from './Skeleton'

interface Props {
  recentRecipes: Recipe[]
  publishedRecipes: Recipe[]
  loading?: boolean
}

export default function UserPanel({ recentRecipes, publishedRecipes, loading }: Props) {
  return (
    <aside style={{
      width: '240px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #fde68a',
        position: 'sticky',
        top: '20px',
        boxShadow: '0 2px 12px rgba(249,115,22,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '14px', borderBottom: '1px solid #fef3c7' }}>
          <img
            src="https://i.pravatar.cc/100?img=12"
            alt="用户头像"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '2px solid #f97316',
              objectFit: 'cover'
            }}
          />
          <div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0 }}>美食达人</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
              已发布 {publishedRecipes.length} 道菜谱
            </p>
          </div>
        </div>

        <h4 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#f97316',
          margin: '14px 0 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>👀</span>最近浏览
        </h4>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '140px',
          overflowY: 'auto'
        }}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Skeleton width="32px" height="32px" variant="circle" />
                <Skeleton width="140px" height="16px" variant="text" />
              </div>
            ))
          ) : recentRecipes.length > 0 ? (
            recentRecipes.map(r => (
              <Link
                key={r.id}
                to={`/recipe/${r.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  color: 'inherit',
                  padding: '4px',
                  borderRadius: '6px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff7ed'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <img
                  src={r.coverImage}
                  alt=""
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    objectFit: 'cover'
                  }}
                />
                <span style={{
                  fontSize: '12px',
                  color: '#334155',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1
                }}>
                  {r.title}
                </span>
              </Link>
            ))
          ) : (
            <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>
              暂无浏览记录
            </p>
          )}
        </div>

        <h4 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#f97316',
          margin: '14px 0 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>📖</span>我的发布
        </h4>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '140px',
          overflowY: 'auto'
        }}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Skeleton width="32px" height="32px" variant="circle" />
                <Skeleton width="140px" height="16px" variant="text" />
              </div>
            ))
          ) : publishedRecipes.length > 0 ? (
            publishedRecipes.map(r => (
              <Link
                key={r.id}
                to={`/recipe/${r.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  color: 'inherit',
                  padding: '4px',
                  borderRadius: '6px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff7ed'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <img
                  src={r.coverImage}
                  alt=""
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    objectFit: 'cover'
                  }}
                />
                <span style={{
                  fontSize: '12px',
                  color: '#334155',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1
                }}>
                  {r.title}
                </span>
              </Link>
            ))
          ) : (
            <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>
              还没发布过菜谱
            </p>
          )}
        </div>

        <Link
          to="/publish"
          style={{
            display: 'block',
            marginTop: '14px',
            textAlign: 'center',
            padding: '10px',
            backgroundColor: '#f97316',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f97316'}
        >
          + 发布新菜谱
        </Link>
      </div>
    </aside>
  )
}
