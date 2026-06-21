import React, { useRef, useState } from 'react';
import { FaUpload, FaFilePdf } from 'react-icons/fa';
import { useAppStore } from '../store';

const SAMPLE_RESUME = {
  name: '张三',
  email: 'zhangsan@example.com',
  phone: '138-0000-0000',
  skills: ['React', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Node.js', 'Webpack'],
  experience: [
    {
      company: 'XX科技有限公司',
      position: '高级前端工程师',
      duration: '5年',
      description: '负责公司核心产品的前端架构设计与开发，使用React技术栈，带领团队完成多个大型互联网项目。',
    },
    {
      company: 'YY互联网公司',
      position: '前端开发工程师',
      duration: '2年',
      description: '参与电商平台前端开发，负责商品详情页、购物车等核心模块，优化页面加载性能。',
    },
  ],
  education: [
    {
      school: '清华大学',
      degree: '硕士',
      major: '计算机科学与技术',
      duration: '2016-2019',
    },
    {
      school: '北京大学',
      degree: '本科',
      major: '软件工程',
      duration: '2012-2016',
    },
  ],
  softSkills: ['沟通协作', '团队领导', '学习能力强', '问题解决', '创新思维'],
  industryKnowledge: ['互联网行业', '电商平台', 'SaaS产品', '移动端开发'],
  summary: '7年前端开发经验，精通React生态，具备良好的团队协作和沟通能力，曾主导多个大型互联网项目从0到1的建设。',
};

const ResumeUploader: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { isParsing, parseProgress, setIsParsing, setParseProgress, setResumeData } = useAppStore();

  const simulateParsing = () => {
    setIsParsing(true);
    setParseProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        setParseProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setResumeData(SAMPLE_RESUME);
          setIsParsing(false);
        }, 300);
      } else {
        setParseProgress(progress);
      }
    }, 300);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) simulateParsing();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) simulateParsing();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="uploader-card stagger-item">
      <h3 className="uploader-title">
        <FaFilePdf className="title-icon" />
        简历上传
      </h3>
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onClick={handleClick}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <FaUpload className="upload-icon" />
        <p className="upload-text">点击或拖拽PDF文件到此处上传</p>
        <p className="upload-hint">支持PDF格式，最大10MB</p>
      </div>
      {isParsing && (
        <div className="progress-container">
          <div className="progress-label">解析中...</div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${parseProgress}%` }}
            />
          </div>
          <div className="progress-percent">{Math.round(parseProgress)}%</div>
        </div>
      )}
    </div>
  );
};

export default ResumeUploader;
