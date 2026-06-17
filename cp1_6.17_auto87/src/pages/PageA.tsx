import { useState } from 'react';

const longText = `这是一段很长的文本内容，用于测试滚动位置的保存与恢复功能。
在大型单页应用中，用户经常会浏览很长的页面，当他们离开后再返回时，
希望能够精确回到之前阅读的位置，而不是每次都从页面顶部开始。
这个应用就解决了这个问题。
下面是更多内容，用来让页面产生滚动条：

段落一：Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

段落二：Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

段落三：Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

段落四：Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.

段落五：Consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam.

段落六：Nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?

段落七：At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.

段落八：Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus.

段落九：Id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.

段落十：Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.

感谢阅读！您可以在下方表单填写内容，然后切换页面再返回，测试状态恢复功能。`;

export function PageA() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <div className="page-a">
      <h1 style={{ color: '#2C3E50', fontSize: '28px', fontWeight: 600, marginBottom: '20px' }}>
        页面 A - 长文本与表单
      </h1>

      <div
        className="card"
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ color: '#2C3E50', fontSize: '20px', marginBottom: '16px' }}>长文本区域</h2>
        <div
          style={{
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '16px',
            background: '#F8F9FA',
            borderRadius: '8px',
            lineHeight: 1.8,
            color: '#34495E',
            whiteSpace: 'pre-wrap',
          }}
        >
          {longText}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          padding: '24px',
        }}
      >
        <h2 style={{ color: '#2C3E50', fontSize: '20px', marginBottom: '20px' }}>用户留言表单</h2>

        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="name"
            style={{
              display: 'block',
              marginBottom: '6px',
              color: '#34495E',
              fontWeight: 500,
            }}
          >
            姓名
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入您的姓名"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #BDC3C7',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3498DB';
              e.target.style.boxShadow = '0 0 0 3px #3498DB40';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#BDC3C7';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              marginBottom: '6px',
              color: '#34495E',
              fontWeight: 500,
            }}
          >
            邮箱
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入您的邮箱"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #BDC3C7',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3498DB';
              e.target.style.boxShadow = '0 0 0 3px #3498DB40';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#BDC3C7';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="message"
            style={{
              display: 'block',
              marginBottom: '6px',
              color: '#34495E',
              fontWeight: 500,
            }}
          >
            留言
          </label>
          <textarea
            id="message"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="请输入您的留言内容..."
            rows={5}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #BDC3C7',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3498DB';
              e.target.style.boxShadow = '0 0 0 3px #3498DB40';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#BDC3C7';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            background: '#E74C3C',
            color: 'white',
            border: 'none',
            padding: '12px 32px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s, transform 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = '#C0392B';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = '#E74C3C';
          }}
          onMouseDown={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'scale(0.97)';
          }}
          onMouseUp={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          {submitted ? '提交成功！' : '提交'}
        </button>

        {submitted && (
          <p style={{ color: '#27AE60', marginTop: '12px', marginLeft: '16px', display: 'inline-block' }}>
            模拟数据已提交
          </p>
        )}
      </form>
    </div>
  );
}

export default PageA;
