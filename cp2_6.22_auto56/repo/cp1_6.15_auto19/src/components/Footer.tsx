export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>🐾 宠乐园</h3>
            <p>
              让每一只毛孩子都能找到温暖的家。我们致力于连接宠物主人与爱心寄养家庭，
              提供安全、可靠、温馨的寄养服务体验。
            </p>
          </div>
          <div className="footer-column">
            <h4>快速链接</h4>
            <ul>
              <li><a href="/">首页</a></li>
              <li><a href="/matching">找寄养家庭</a></li>
              <li><a href="/">成为寄养家庭</a></li>
              <li><a href="/">常见问题</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>服务支持</h4>
            <ul>
              <li><a href="/">帮助中心</a></li>
              <li><a href="/">联系客服</a></li>
              <li><a href="/">服务条款</a></li>
              <li><a href="/">隐私政策</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>联系我们</h4>
            <ul>
              <li>📞 400-888-8888</li>
              <li>📧 hello@petfoster.com</li>
              <li>📍 北京市朝阳区</li>
              <li>🕐 9:00 - 21:00</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 宠乐园 PetFoster Community. All rights reserved. Made with ❤️ for pets
        </div>
      </div>
    </footer>
  )
}
