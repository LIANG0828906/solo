import { useAppStore } from '../store';
import SocialFeed from '../components/SocialFeed';
import './styles/SocialPage.css';

export function SocialPage() {
  const { socialPosts, toggleLike, addComment } = useAppStore();

  const handleLike = (postId: string) => {
    toggleLike(postId);
  };

  const handleComment = (postId: string, content: string) => {
    if (content.trim()) {
      addComment(postId, content.trim());
    }
  };

  return (
    <div className="social-page">
      <div className="social-page__header">
        <h1>社群动态</h1>
        <p>看看好友们的训练进度</p>
      </div>
      <div className="social-page__content">
        <SocialFeed posts={socialPosts} onLike={handleLike} onComment={handleComment} />
      </div>
    </div>
  );
}
