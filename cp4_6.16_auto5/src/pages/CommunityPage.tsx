import { useState, useEffect } from 'react';
import PhotoGallery, { PhotoData } from '../modules/community/PhotoGallery';

interface CommunityPageProps {
  user: { username: string } | null;
}

const defaultPhotos: PhotoData[] = [
  {
    id: 1,
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20vegetable%20tanned%20leather%20wallet%2C%20beautifully%20crafted%2C%20top%20view%2C%20warm%20wooden%20background%2C%20professional%20lighting&image_size=square',
    author: '匠心匠人',
    userId: 'user1',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    title: '第一个手作钱包，成就感满满！',
  },
  {
    id: 2,
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20hand%20stitched%20leather%20bifold%20wallet%2C%20saddle%20stitch%20detail%2C%20tan%20color%2C%20craftsmanship%20display&image_size=square',
    author: '皮革爱好者',
    userId: 'user2',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    title: '马鞍针法缝了整整一下午',
  },
  {
    id: 3,
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handcrafted%20leather%20wallet%20open%20showing%20card%20slots%2C%20polished%20edges%2C%20rich%20brown%20leather%2C%20artisan%20made&image_size=square',
    author: '新手皮友',
    userId: 'user3',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    title: '封边打磨了5次，效果还不错',
  },
  {
    id: 4,
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=minimalist%20handmade%20leather%20card%20holder%20wallet%2C%20simple%20design%2C%20natural%20leather%20patina%2C%20craft%20workshop%20setting&image_size=square',
    author: '手工达人',
    userId: 'user4',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    title: '做了个简约款，日常通勤必备',
  },
  {
    id: 5,
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20style%20handmade%20leather%20wallet%2C%20burnished%20edges%2C%20waxed%20thread%20stitching%2C%20old%20world%20craftsmanship&image_size=square',
    author: '皮具收藏家',
    userId: 'user5',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    title: '复古风配色，越用越有味道',
  },
  {
    id: 6,
    imageUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20leather%20wallet%20with%20money%20clip%2C%20premium%20vegetable%20tanned%20leather%2C%20detail%20shot%20of%20stitching&image_size=square',
    author: '皮匠小吴',
    userId: 'user6',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    title: '给老爸做的生日礼物',
  },
];

export default function CommunityPage({ user }: CommunityPageProps) {
  const [photos, setPhotos] = useState<PhotoData[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('leather_photos');
    let userPhotos: PhotoData[] = [];
    if (stored) {
      try {
        userPhotos = JSON.parse(stored);
      } catch {
        userPhotos = [];
      }
    }

    const uniqueIds = new Set<number>();
    const allPhotos: PhotoData[] = [];

    [...userPhotos, ...defaultPhotos].forEach((photo) => {
      if (!uniqueIds.has(photo.id)) {
        uniqueIds.add(photo.id);
        allPhotos.push(photo);
      }
    });

    allPhotos.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setPhotos(allPhotos);
  }, []);

  const handleStorageChange = () => {
    const stored = localStorage.getItem('leather_photos');
    if (stored) {
      try {
        const userPhotos: PhotoData[] = JSON.parse(stored);
        const uniqueIds = new Set<number>();
        const allPhotos: PhotoData[] = [];

        [...userPhotos, ...defaultPhotos].forEach((photo) => {
          if (!uniqueIds.has(photo.id)) {
            uniqueIds.add(photo.id);
            allPhotos.push(photo);
          }
        });

        allPhotos.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setPhotos(allPhotos);
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🎨 皮友作品墙</h1>
        <p className="page-subtitle">
          共 {photos.length} 件作品 · 分享你的手作，交流皮具工艺
        </p>
      </div>

      {!user && (
        <div
          className="paper-card"
          style={{
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto 32px',
            padding: '20px',
          }}
        >
          <p style={{ color: 'var(--color-leather-dark)', marginBottom: '12px' }}>
            💡 登录后可以点赞和评论其他皮友的作品哦～
          </p>
        </div>
      )}

      <PhotoGallery photos={photos} currentUser={user} />
    </div>
  );
}
