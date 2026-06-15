import { memo } from 'react';
import { Heart } from 'lucide-react';

export const Footer = memo(function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__content">
          <p className="footer__text">
            © {new Date().getFullYear()} 虚拟艺术展馆 · 策展未来，连接艺术
          </p>
          <p className="footer__made">
            用 <Heart size={14} className="footer__heart" /> 打造的数字艺术平台
          </p>
        </div>
      </div>
    </footer>
  );
});
