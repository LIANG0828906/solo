import type { PlatformType, AdaptedContent, Post } from '../types';

const stripMarkdown = (text: string): string => {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/>\s/g, '')
    .replace(/-\s/g, '')
    .replace(/\d+\.\s/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const truncateText = (text: string, maxLength: number): string => {
  const plainText = stripMarkdown(text);
  if (plainText.length <= maxLength) return plainText;
  return plainText.slice(0, maxLength) + '...';
};

export const adaptForBlog = (post: Post): AdaptedContent => {
  return {
    platform: 'blog',
    title: post.title,
    content: post.content,
    formattedContent: post.content,
  };
};

export const adaptForNewsletter = (post: Post): AdaptedContent => {
  const truncated = truncateText(post.content, 200);
  const content = `${truncated}\n\n[阅读更多](${post.title})`;
  return {
    platform: 'newsletter',
    title: post.title,
    content,
    formattedContent: `**${post.title}**\n\n${post.summary}\n\n${truncated}\n\n---\n*点击下方"阅读更多"查看完整内容*`,
  };
};

export const adaptForSocial = (post: Post): AdaptedContent => {
  const summary = truncateText(post.summary || post.content, 140);
  const content = `${post.title}\n\n${summary}\n\n📸 [封面图]`;
  return {
    platform: 'social',
    title: post.title,
    content,
    formattedContent: `**${post.title}**\n\n${summary}\n\n🖼️ *配图已自动生成*`,
  };
};

export const adaptContent = (post: Post, platform: PlatformType): AdaptedContent => {
  switch (platform) {
    case 'blog':
      return adaptForBlog(post);
    case 'newsletter':
      return adaptForNewsletter(post);
    case 'social':
      return adaptForSocial(post);
    default:
      return adaptForBlog(post);
  }
};

export const adaptForMultiplePlatforms = (
  post: Post,
  platforms: PlatformType[]
): AdaptedContent[] => {
  return platforms.map((platform) => adaptContent(post, platform));
};
