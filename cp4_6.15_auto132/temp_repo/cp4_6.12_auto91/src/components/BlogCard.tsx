import { Link } from 'react-router-dom';
import type { Blog } from '@/types';

interface BlogCardProps {
  blog: Blog;
}

export default function BlogCard({ blog }: BlogCardProps) {
  const truncateContent = (content: string, maxLength: number) => {
    const plainText = content.replace(/<[^>]*>/g, '').replace(/[#*`]/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.slice(0, maxLength) + '...';
  };

  const extractFirstImage = (content: string) => {
    const imgRegex = /!\[.*?\]\((.*?)\)/;
    const match = content.match(imgRegex);
    if (match) return match[1];

    const htmlImgRegex = /<img[^>]+src=["']([^"']+)["']/;
    const htmlMatch = content.match(htmlImgRegex);
    if (htmlMatch) return htmlMatch[1];

    return null;
  };

  const firstImage = extractFirstImage(blog.content);

  return (
    <Link
      to={`/blogs/${blog.id}`}
      className="block rounded-xl overflow-hidden transition-all duration-250 hover:-translate-y-1"
      style={{
        backgroundColor: '#1a1a2e',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transitionDuration: '0.25s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
    >
      <div className="flex">
        <div
          className="flex-shrink-0 overflow-hidden"
          style={{ width: '160px', height: '160px' }}
        >
          <img
            src={firstImage || blog.coverUrl}
            alt={blog.title}
            className="w-full h-full object-cover transition-transform duration-250 hover:scale-105"
            style={{ transitionDuration: '0.25s' }}
          />
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h3
              className="font-semibold mb-2 line-clamp-2"
              style={{ fontSize: '18px', color: '#fff' }}
            >
              {blog.title}
            </h3>
            <p
              className="line-clamp-3"
              style={{ fontSize: '14px', color: '#888', lineHeight: '1.6' }}
            >
              {truncateContent(blog.content, 100)}
            </p>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span style={{ fontSize: '13px', color: '#666' }}>
              作者: {blog.author}
            </span>
            <span style={{ fontSize: '13px', color: '#666' }}>
              {new Date(blog.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
