import React, { useRef, useState } from 'react';
import { FaUpload, FaFilePdf } from 'react-icons/fa';
import { useAppStore } from '../store';
import { parseResume } from '../modules/parser/ParserModule';
import { ResumeData as ParserResumeData } from '../modules/parser/ParserModule';
import { ResumeData } from '../types';

const STAGE_LABELS: Record<string, string> = {
  '读取PDF文件': '加载PDF文件',
  '提取文本内容': '提取文本内容',
  '结构化解析': '智能结构化解析',
  '解析完成': '解析完成',
};

function mapParserToStoreData(parser: ParserResumeData): ResumeData {
  const skills = parser.skills.map(s => s.name);
  const softSkills: string[] = [];
  const industryKnowledge: string[] = [];

  const summary = parser.basicInfo.selfIntroduction || '';
  const descText = parser.experiences.map(e => e.description).join(' ');

  for (const sk of parser.skills) {
    const n = sk.name;
    if (['沟通', '协作', '团队合作', '领导', '管理', '学习', '创新', '责任心', '执行力'].some(k => n.includes(k))) {
      softSkills.push(n);
    }
  }
  if (softSkills.length === 0 && (summary.includes('沟通') || descText.includes('协作'))) {
    softSkills.push('沟通协作');
  }
  if (summary.includes('领导') || descText.includes('带领')) {
    softSkills.push('领导力');
  }

  const industryKeywords = ['互联网', '电商', '金融', '教育', '医疗', '游戏', 'SaaS', '大数据', '云计算', '人工智能'];
  for (const ik of industryKeywords) {
    if (summary.includes(ik) || descText.includes(ik)) {
      industryKnowledge.push(ik);
    }
  }

  return {
    name: parser.basicInfo.name,
    email: parser.basicInfo.email,
    phone: parser.basicInfo.phone,
    skills,
    experience: parser.experiences.map(e => ({
      company: e.company,
      position: e.position,
      duration: e.duration,
      description: e.description,
    })),
    education: parser.education.map(e => ({
      school: e.school,
      degree: e.degree,
      major: e.major,
      duration: `${e.startDate}-${e.endDate}`,
    })),
    softSkills,
    industryKnowledge,
    summary: parser.basicInfo.selfIntroduction,
  };
}

const ResumeUploader: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [stageLabel, setStageLabel] = useState('');
  const { isParsing, parseProgress, setIsParsing, setParseProgress, setResumeData } = useAppStore();

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('请上传PDF格式文件');
      return;
    }

    setIsParsing(true);
    setParseProgress(0);
    setStageLabel('准备解析...');

    try {
      const parserData = await parseResume(file, (p) => {
        setParseProgress(p.percent);
        setStageLabel(STAGE_LABELS[p.stage] || p.stage);
      });

      const storeData = mapParserToStoreData(parserData);
      setResumeData(storeData);
    } catch (err) {
      console.error('简历解析失败:', err);
      alert('简历解析失败，请重试');
    } finally {
      setIsParsing(false);
      setStageLabel('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
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
          <div className="progress-label">{stageLabel || '解析中...'}</div>
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
