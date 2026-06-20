import React from 'react';
import { marked } from 'marked';
import styles from './Markdown渲染器.module.css';

interface MarkdownRendererProps {
  content: string;
}

marked.setOptions({
  breaks: true,
  gfm: true,
});

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const html = marked.parse(content) as string;

  return (
    <div
      className={styles.markdown}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownRenderer;
