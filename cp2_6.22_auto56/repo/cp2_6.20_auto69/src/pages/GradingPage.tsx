import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Moon, Sun, BarChart3, MessageSquare } from 'lucide-react';
import { EssayParagraph } from '@/components/EssayParagraph';
import { CommentPopup } from '@/components/CommentPopup';
import { CommentList } from '@/components/CommentList';
import { RingProgress } from '@/components/RingProgress';
import { ScorePanel } from '@/components/ScorePanel';
import { useGradingStore } from '@/store/useGradingStore';
import { essayApi } from '@/api';
import type { Essay } from '@/types';

export const GradingPage: React.FC = () => {
  const { classId, essayId } = useParams<{ classId: string; essayId: string }>();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [popupState, setPopupState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    paragraphIndex: number;
  }>({ visible: false, x: 0, y: 0, paragraphIndex: -1 });

  const {
    essay,
    comments,
    setEssay,
    setSelectedParagraph,
    setPopupVisible,
    loadComments,
    loadPresetComments,
    selectedParagraphIndex,
  } = useGradingStore();

  useEffect(() => {
    const init = async () => {
      await loadPresetComments();
      if (essayId) {
        await loadComments(essayId);
        try {
          const res = await essayApi.getEssayById(essayId);
          if (res.code === 200) {
            setEssay(res.data);
          }
        } catch {
          const mockEssay: Essay = {
            id: essayId || 'essay-001',
            classId: classId || 'class-001',
            studentName: '李明',
            title: '论科技与人文的关系',
            uploadTime: '2024-01-15T10:00:00Z',
            content: '',
            paragraphs: [
              '在当今这个科技飞速发展的时代，人们的生活方式发生了翻天覆地的变化。智能手机、互联网、人工智能等新技术不断涌现，深刻地改变着我们与世界的互动方式。然而，在拥抱科技带来便利的同时，我们也不应忽视人文精神的价值与意义。',
              '科技的发展为人类带来了前所未有的便利。以通信技术为例，从书信到电话，再到如今的即时通讯软件，信息传递的速度和效率得到了质的飞跃。远方的亲友可以通过视频通话面对面交流，地理距离不再是沟通的障碍。医疗领域的科技进步更是挽救了无数生命，先进的诊断设备和治疗手段让许多曾经的绝症变得可治。',
              '然而，科技的过度发展也带来了一些不容忽视的问题。人们越来越依赖电子设备，面对面的交流逐渐减少，人际关系变得淡漠。碎片化的阅读习惯削弱了人们深度思考的能力，算法推荐的信息茧房让人们视野变得狭隘。部分年轻人沉迷于虚拟世界，忽略了现实生活中真实的情感体验和人际交往。',
              '人文精神是人类文明的灵魂，它教导我们如何思考、如何审美、如何与他人和自然和谐相处。文学、艺术、哲学这些人文学科虽然不能直接转化为生产力，但它们塑造着我们的价值观和世界观，让我们在纷繁复杂的世界中保持清醒的头脑和独立的人格。一个没有人文精神滋养的社会，即使物质再丰富，也难以称得上是真正文明的社会。',
              "科技与人文并非对立的两极，而是相辅相成、缺一不可的关系。科技是工具，是推动社会进步的引擎；人文是方向，是确保科技服务于人类福祉的指南针。只有将二者有机结合，我们才能在享受科技便利的同时，不迷失人性的本真。爱因斯坦曾说过：\"科学只能断言'是什么'，而不能断言'应该是什么'。\"这句话深刻地揭示了科技与人文互补的本质。",
              '综上所述，我们应该以开放的心态拥抱科技进步，同时保持对人文精神的敬畏与坚守。让科技的光芒照亮前行的道路，让人文的温暖滋润我们的心灵，这样才能创造一个更加美好、更加人性化的未来世界。',
            ],
          };
          setEssay(mockEssay);
        }
      }
    };
    init();
  }, [classId, essayId, setEssay, loadComments, loadPresetComments]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleParagraphClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setSelectedParagraph(index);
    setPopupVisible(true);
    setPopupState({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      paragraphIndex: index,
    });
  };

  const handleClosePopup = () => {
    setPopupState({ ...popupState, visible: false });
    setSelectedParagraph(null);
    setPopupVisible(false);
  };

  const positiveCount = comments.filter((c) => c.type === 'positive').length;
  const improvementCount = comments.filter((c) => c.type === 'improvement').length;
  const total = comments.length || 1;
  const positivePercent = Math.round((positiveCount / total) * 100);
  const improvementPercent = Math.round((improvementCount / total) * 100);

  const handleEditComment = () => {
    // 编辑功能占位
  };

  const handleDeleteComment = (id: string) => {
    useGradingStore.getState().setComments(
      comments.filter((c) => c.id !== id)
    );
  };

  return (
    <div className="min-h-screen bg-bg-page">
      <header className="bg-bg-panel shadow-sm sticky top-0 z-50">
        <div className="max-w-full mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-text-secondary hover:text-brand transition-colors text-sm"
            >
              <ArrowLeft size={18} />
              返回班级
            </button>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
                <BookOpen size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-text-primary">
                  {essay?.title || '作文批改'}
                </h1>
                <p className="text-xs text-text-secondary">
                  学生：{essay?.studentName || '—'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/stats/${classId}`)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-text-primary hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs font-medium"
            >
              <BarChart3 size={16} />
              统计
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-text-primary hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-57px)]">
        <div className="flex-1 lg:w-[60%] bg-bg-essay overflow-y-auto scrollbar-thin">
          <div className="max-w-3xl mx-auto px-8 py-8">
            {essay ? (
              <>
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-bold font-serif text-text-primary mb-2">
                    {essay.title}
                  </h2>
                  <p className="text-sm text-text-secondary">
                    {essay.studentName} · {new Date(essay.uploadTime).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div>
                  {essay.paragraphs.map((paragraph, index) => {
                    const paraComments = comments.filter(
                      (c) => c.paragraphIndex === index
                    );
                    return (
                      <EssayParagraph
                        key={index}
                        index={index}
                        content={paragraph}
                        isHighlighted={selectedParagraphIndex === index}
                        comments={paraComments}
                        onClick={(e) => handleParagraphClick(e, index)}
                      />
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-text-secondary">
                加载中...
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[40%] bg-bg-panel border-l border-gray-200 dark:border-gray-700 flex flex-col lg:h-full h-[50vh]">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <RingProgress
              positivePercent={comments.length ? positivePercent : 0}
              improvementPercent={comments.length ? improvementPercent : 0}
            />
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-brand" />
                <span className="font-semibold text-sm text-text-primary">
                  评语列表 ({comments.length})
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <CommentList
                comments={comments}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
              />
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            <ScorePanel />
          </div>
        </div>
      </div>

      {popupState.visible && (
        <CommentPopup
          clickX={popupState.x}
          clickY={popupState.y}
          paragraphIndex={popupState.paragraphIndex}
          onClose={handleClosePopup}
        />
      )}
    </div>
  );
};
