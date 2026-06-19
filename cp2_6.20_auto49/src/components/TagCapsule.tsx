import type { Tag } from '@/types';

const categoryStyles: Record<Tag['category'], string> = {
  tech: 'bg-garden-tag-blue text-garden-tag-blue-text',
  life: 'bg-garden-tag-green text-garden-tag-green-text',
  study: 'bg-garden-tag-purple text-garden-tag-purple-text',
};

export default function TagCapsule({ tag }: { tag: Tag }) {
  return (
    <span className={`tag-capsule ${categoryStyles[tag.category]}`}>
      {tag.name}
    </span>
  );
}
