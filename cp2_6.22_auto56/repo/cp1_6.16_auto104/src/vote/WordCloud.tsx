import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';
import { useDebateStore, type Argument } from '@/store/debateStore';

interface WordData {
  text: string;
  value: number;
}

const WARM_COLORS = [
  '#FF6B6B', '#FF8E53', '#FFD93D', '#FF6B9D', 
  '#FFA07A', '#FF7F50', '#FF4500', '#DC143C',
  '#FF6347', '#FFE4B5', '#FFD700', '#FFA500',
];

const STOP_WORDS = new Set([
  '的', '是', '在', '了', '和', '与', '或', '不', '也', '都',
  '就', '而', '及', '与', '其', '之', '等', '这', '那', '有',
  '我', '你', '他', '她', '它', '们', '我们', '你们', '他们',
  '一个', '一种', '可以', '会', '能', '能够', '应该', '必须',
  '因为', '所以', '但是', '然而', '如果', '虽然', '不仅',
  '而且', '以及', '等等', '什么', '怎么', '为什么', '如何',
]);

export function WordCloud() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { arguments: allArguments, phase } = useDebateStore();
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });

  const extractWords = (args: Argument[]): WordData[] => {
    const wordMap = new Map<string, number>();
    
    args.forEach(arg => {
      const text = arg.content;
      const words = text.split(/[\s，。！？、；：""''（）【】\[\].,!?;:'"()\-—]+/).filter(w => w.length > 1);
      
      words.forEach(word => {
        const lowerWord = word.toLowerCase();
        if (!STOP_WORDS.has(lowerWord) && lowerWord.length > 1) {
          wordMap.set(lowerWord, (wordMap.get(lowerWord) || 0) + 1);
        }
      });
    });

    return Array.from(wordMap.entries())
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 50);
  };

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: Math.max(width, 200), height: Math.max(height, 200) });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const words = extractWords(allArguments);
    if (words.length === 0) return;

    const maxValue = Math.max(...words.map(w => w.value));
    const minValue = Math.min(...words.map(w => w.value));
    const maxFontSize = Math.min(dimensions.width, dimensions.height) / 8;
    const minFontSize = 14;

    const layout = cloud()
      .size([dimensions.width, dimensions.height])
      .words(words.map(w => ({
        text: w.text,
        size: minFontSize + ((w.value - minValue) / (maxValue - minValue || 1)) * (maxFontSize - minFontSize),
      })))
      .padding(5)
      .rotate(() => (Math.random() > 0.5 ? 0 : 0))
      .font('Inter')
      .fontSize(d => d.size)
      .on('end', draw);

    layout.start();

    function draw(words: cloud.Word[]) {
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();

      const group = svg
        .append('g')
        .attr('transform', `translate(${dimensions.width / 2},${dimensions.height / 2})`);

      group
        .selectAll('text')
        .data(words)
        .enter()
        .append('text')
        .style('font-size', d => `${d.size}px`)
        .style('font-family', 'Inter, sans-serif')
        .style('font-weight', '600')
        .style('fill', () => WARM_COLORS[Math.floor(Math.random() * WARM_COLORS.length)])
        .style('opacity', 0)
        .attr('text-anchor', 'middle')
        .attr('transform', d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
        .text(d => d.text)
        .transition()
        .duration(800)
        .delay((_, i) => i * 30)
        .style('opacity', 1);
    }
  }, [allArguments, dimensions, phase]);

  const hasArguments = allArguments.length > 0;

  return (
    <div ref={containerRef} className="w-full h-full min-h-[200px] flex items-center justify-center">
      {hasArguments ? (
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="word-cloud-svg"
        />
      ) : (
        <div className="text-gray-500 text-sm">
          辩论开始后将生成关键词云
        </div>
      )}
      <style>{`
        .word-cloud-svg text {
          cursor: default;
          transition: transform 0.2s ease;
        }
        .word-cloud-svg text:hover {
          filter: brightness(1.2);
        }
      `}</style>
    </div>
  );
}
