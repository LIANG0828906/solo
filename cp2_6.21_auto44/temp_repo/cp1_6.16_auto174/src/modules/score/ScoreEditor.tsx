import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Slider, Switch, Select, Input, InputNumber, message } from 'antd';
import {
  PlusOutlined, MinusOutlined, SaveOutlined, FolderOpenOutlined, DownloadOutlined
} from '@ant-design/icons';
import { useScoreStore, NoteDuration, Accidental, VoiceName, TimeSignature, KeySignature } from '../../store/scoreStore';
import { downloadMXL } from '../../utils/mxlExport';

const { Option } = Select;

const DURATIONS: { key: NoteDuration; label: string }[] = [
  { key: 'w', label: '全' },
  { key: 'h', label: '二分' },
  { key: 'q', label: '四分' },
  { key: '8', label: '八分' },
  { key: '16', label: '十六' }
];

const ACCIDENTALS: { key: Accidental; label: string }[] = [
  { key: null, label: '♮' },
  { key: '#', label: '♯' },
  { key: 'b', label: '♭' },
  { key: 'n', label: '还原' }
];

const VOICES: VoiceName[] = ['Soprano', 'Alto', 'Tenor', 'Bass'];

const TIME_SIGNATURES: TimeSignature[] = ['2/4', '3/4', '4/4', '6/8'];
const KEY_SIGNATURES: KeySignature[] = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db'];

const TREBLE_PITCHES = ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'B3', 'A3', 'G3', 'F3'];
const BASS_PITCHES = ['E4', 'D4', 'C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3', 'B2', 'A2'];

const DURATION_BEATS: Record<NoteDuration, number> = {
  'w': 4, 'h': 2, 'q': 1, '8': 0.5, '16': 0.25
};

function ScoreEditor() {
  const store = useScoreStore();
  const svgRefs = useRef<(SVGSVGElement | null)[]>([]);
  const [loadId, setLoadId] = useState('');
  const [projectName, setProjectName] = useState(store.project.name);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    setProjectName(store.project.name);
  }, [store.project.id]);

  useEffect(() => {
    renderAllVoices();
  }, [
    store.project.voices,
    store.project.keySignature,
    store.project.timeSignature,
    store.project.totalMeasures
  ]);

  const renderAllVoices = useCallback(() => {
    store.project.voices.forEach((voice, idx) => {
      const svg = svgRefs.current[idx];
      if (!svg) return;
      renderVoiceStaff(svg, voice, idx);
    });
  }, [store.project]);

  const renderVoiceStaff = async (svg: SVGSVGElement, voiceData: typeof store.project.voices[0], voiceIdx: number) => {
    svg.innerHTML = '';
    const Vex = await import('vexflow');
    const { Renderer, Stave, StaveNote, Formatter, Accidental, Voice, Barline } = Vex.Flow;

    const renderer = new Renderer(svg, Renderer.Backends.SVG);
    const width = Math.max(900, svg.clientWidth || 900);
    renderer.resize(width, 160);
    const context = renderer.getContext();

    context.setFont('Arial', 10);

    const clef = voiceData.clef;
    const keySig = store.project.keySignature;
    const timeSig = store.project.timeSignature;
    const totalMeasures = store.project.totalMeasures;
    const beatsPerMeasure = parseInt(timeSig.split('/')[0]);

    const measuresPerLine = Math.min(4, totalMeasures);
    const measureWidth = (width - 60) / measuresPerLine;

    const staves: typeof Stave.prototype[] = [];
    const allVoices: typeof Voice.prototype[] = [];

    for (let line = 0; line * measuresPerLine < totalMeasures; line++) {
      const measuresInLine = Math.min(measuresPerLine, totalMeasures - line * measuresPerLine);
      const lineStaves: typeof Stave.prototype[] = [];

      for (let m = 0; m < measuresInLine; m++) {
        const mIdx = line * measuresPerLine + m;
        const stave = new Stave(30 + m * measureWidth, 10 + line * 160, measureWidth - 10);

        if (m === 0 && line === 0) {
          stave.addClef(clef).addKeySignature(keySig).addTimeSignature(timeSig);
        } else if (m === 0) {
          stave.addClef(clef);
        }

        if (mIdx === totalMeasures - 1) {
          stave.setEndBarType(Barline.type.END);
        }

        stave.setContext(context).draw();
        lineStaves.push(stave);
        staves.push(stave);

        const measureNotes = voiceData.notes
          .filter(n => n.measure === mIdx)
          .sort((a, b) => a.position - b.position);

        const vfNotes: (typeof StaveNote.prototype | typeof Barline.prototype)[] = [];
        let curPos = 0;

        measureNotes.forEach(note => {
          if (note.position > curPos + 0.001) {
            const restBeats = note.position - curPos;
            const restDur = beatsToVFDuration(restBeats);
            const restNote = new StaveNote({
              keys: ['b/4'],
              duration: restDur + 'r',
              clef
            });
            vfNotes.push(restNote);
            curPos = note.position;
          }

          const { pitch, octave } = splitPitch(note.pitch);
          let key = `${pitch.toLowerCase()}/${octave}`;
          const vfNote = new StaveNote({
            keys: [key],
            duration: note.duration,
            clef
          });

          if (note.accidental === '#') {
            vfNote.addModifier(new Accidental('#'), 0);
          } else if (note.accidental === 'b') {
            vfNote.addModifier(new Accidental('b'), 0);
          } else if (note.accidental === 'n') {
            vfNote.addModifier(new Accidental('n'), 0);
          }

          if (note.highlighted) {
            vfNote.setStyle({
              strokeStyle: 'rgba(30, 136, 229, 0.8)',
              fillStyle: '#000000',
              lineWidth: 3
            });
          }

          vfNotes.push(vfNote);
          curPos = note.position + DURATION_BEATS[note.duration];
        });

        if (curPos < beatsPerMeasure - 0.001) {
          const restBeats = beatsPerMeasure - curPos;
          const restDur = beatsToVFDuration(restBeats);
          const restNote = new StaveNote({
            keys: ['b/4'],
            duration: restDur + 'r',
            clef
          });
          vfNotes.push(restNote);
        }

        const voice = new Voice({
          num_beats: beatsPerMeasure,
          beat_value: 4
        });
        if (vfNotes.length > 0) {
          try {
            voice.addTickables(vfNotes as any[]);
          } catch (e) {
            console.warn('Voice error:', e);
          }
        }
        allVoices.push(voice);

        if (vfNotes.length > 0) {
          new Formatter().joinVoices([voice]).format([voice], measureWidth - 30);
          voice.draw(context, stave);
        }
      }
    }

    const staffLines = svg.querySelectorAll('line');
    staffLines.forEach(line => {
      const stroke = line.getAttribute('stroke');
      if (stroke && stroke.toLowerCase() !== 'none') {
        const y1 = parseFloat(line.getAttribute('y1') || '0');
        const y2 = parseFloat(line.getAttribute('y2') || '0');
        if (Math.abs(y1 - y2) < 1 && Math.abs(y1 - y2) >= 0) {
          line.setAttribute('stroke', '#444444');
        }
      }
    });

    const noteHeads = svg.querySelectorAll('path');
    noteHeads.forEach(head => {
      const fill = head.getAttribute('fill');
      if (fill === '#000' || fill === 'black' || fill === '#000000') {
        head.setAttribute('fill', '#000000');
      }
    });

    const texts = svg.querySelectorAll('text');
    texts.forEach(t => {
      const content = t.textContent || '';
      if (content === '#' || content === '♯') {
        t.setAttribute('fill', '#D32F2F');
      } else if (content === 'b' || content === '♭') {
        t.setAttribute('fill', '#D32F2F');
      } else if (content === 'n' || content === '♮') {
        t.setAttribute('fill', '#D32F2F');
      }
    });
  };

  const splitPitch = (pitch: string): { pitch: string; octave: number } => {
    const m = pitch.match(/^([A-G])(#|b)?(\d)$/);
    if (!m) return { pitch: 'C', octave: 4 };
    return { pitch: m[1] + (m[2] || ''), octave: parseInt(m[3]) };
  };

  const beatsToVFDuration = (beats: number): string => {
    if (beats >= 3.9) return 'w';
    if (beats >= 1.9) return 'h';
    if (beats >= 0.9) return 'q';
    if (beats >= 0.4) return '8';
    return '16';
  };

  const handleStaffClick = (e: React.MouseEvent, voice: VoiceName) => {
    if (store.activeVoice !== voice) return;

    const svg = e.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clef = store.project.voices.find(v => v.name === voice)?.clef || 'treble';
    const pitches = clef === 'treble' ? TREBLE_PITCHES : BASS_PITCHES;

    const staffTop = 34;
    const staffBottom = 106;
    const lineSpacing = 9;
    const relativeY = (staffBottom + staffTop) / 2 - y;
    const pitchIdx = Math.round(relativeY / (lineSpacing / 2));
    const clampedIdx = Math.max(0, Math.min(pitches.length - 1, pitchIdx));
    let selectedPitch = pitches[clampedIdx];

    const measureWidth = (rect.width - 60) / Math.min(4, store.project.totalMeasures);
    const measure = Math.max(0, Math.min(store.project.totalMeasures - 1, Math.floor((x - 30) / measureWidth)));
    const beatsPerMeasure = parseInt(store.project.timeSignature.split('/')[0]);
    const xInMeasure = x - 30 - measure * measureWidth;
    const pos = Math.max(0, Math.min(beatsPerMeasure - DURATION_BEATS[store.selectedDuration],
      Math.round(xInMeasure / (measureWidth / beatsPerMeasure))));

    if (store.selectedAccidental === '#') {
      selectedPitch = selectedPitch.replace(/(\d)$/, '#$1');
    } else if (store.selectedAccidental === 'b') {
      selectedPitch = selectedPitch.replace(/(\d)$/, 'b$1');
    }

    store.addNote(selectedPitch, measure, pos);
    messageApi.success(`添加音符: ${selectedPitch}`);
  };

  const handleSave = async () => {
    try {
      const projectToSave = { ...store.project, name: projectName, updatedAt: Date.now() };
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectToSave)
      });
      const data = await res.json();
      if (data.success) {
        messageApi.success(`已保存! ID: ${data.id}`);
        navigator.clipboard?.writeText(data.id);
      }
    } catch (e) {
      messageApi.error('保存失败');
    }
  };

  const handleLoad = async () => {
    if (!loadId) {
      messageApi.warning('请输入项目ID');
      return;
    }
    try {
      const res = await fetch(`/api/load/${loadId}`);
      const data = await res.json();
      if (data.success) {
        store.loadProject(data.project);
        messageApi.success('加载成功');
      } else {
        messageApi.error('项目不存在');
      }
    } catch (e) {
      messageApi.error('加载失败');
    }
  };

  const handleExport = () => {
    downloadMXL({ ...store.project, name: projectName });
    messageApi.success('MXL文件已导出');
  };

  const addMeasure = () => {
    store.project.totalMeasures = store.project.totalMeasures + 1;
  };

  const removeMeasure = () => {
    if (store.project.totalMeasures > 1) {
      store.project.totalMeasures = store.project.totalMeasures - 1;
    }
  };

  return (
    <div className="score-editor-container" style={{ width: '100%', height: '100%' }}>
      {contextHolder}
      <div className="control-panel">
        <h2 style={{ color: '#FF7043', margin: 0, fontSize: 18, marginBottom: 12 }}>音乐乐谱编辑器</h2>

        <div className="section-title">项目</div>
        <label>项目名称</label>
        <Input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          style={{ background: '#2a2a2a', borderColor: '#444', color: '#fff', borderRadius: 4 }}
        />

        <div className="save-load-btns" style={{ marginTop: 10 }}>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} style={{ flex: 1 }}>
            保存
          </Button>
          <Button icon={<FolderOpenOutlined />} onClick={handleLoad}>
            加载
          </Button>
        </div>
        <Input
          className="project-id-input"
          placeholder="输入项目ID"
          value={loadId}
          onChange={(e) => setLoadId(e.target.value)}
          style={{ background: '#2a2a2a', borderColor: '#444', color: '#fff', borderRadius: 4 }}
        />

        <Button
          icon={<DownloadOutlined />}
          className="export-btn"
          onClick={handleExport}
          style={{ marginTop: 10, width: '100%' }}
        >
          导出 MusicXML (.musicxml)
        </Button>

        <div className="section-title">乐谱参数</div>

        <label>速度 (BPM): {store.project.tempo}</label>
        <Slider
          min={40}
          max={200}
          value={store.project.tempo}
          onChange={(v) => store.setTempo(v as number)}
        />

        <label>节拍</label>
        <Select
          value={store.project.timeSignature}
          onChange={(v) => store.setTimeSignature(v as TimeSignature)}
          style={{ width: '100%', background: '#2a2a2a', color: '#fff', borderRadius: 4 }}
        >
          {TIME_SIGNATURES.map(ts => <Option key={ts} value={ts}>{ts}</Option>)}
        </Select>

        <label style={{ marginTop: 10 }}>调号</label>
        <Select
          value={store.project.keySignature}
          onChange={(v) => store.setKeySignature(v as KeySignature)}
          style={{ width: '100%', background: '#2a2a2a', color: '#fff', borderRadius: 4 }}
        >
          {KEY_SIGNATURES.map(ks => <Option key={ks} value={ks}>{ks} 大调</Option>)}
        </Select>

        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ margin: 0, flex: 1 }}>小节数: {store.project.totalMeasures}</label>
          <Button size="small" icon={<MinusOutlined />} onClick={removeMeasure} />
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={addMeasure} />
        </div>

        <div className="section-title">声部选择</div>
        <div>
          {VOICES.map(v => (
            <button
              key={v}
              className={`voice-btn ${store.activeVoice === v ? 'active' : ''}`}
              onClick={() => store.setActiveVoice(v)}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="section-title">音符时值</div>
        <div className="note-tool-grid">
          {DURATIONS.map(d => (
            <button
              key={d.key}
              className={`note-tool-btn ${store.selectedDuration === d.key ? 'active' : ''}`}
              onClick={() => store.setSelectedDuration(d.key)}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="section-title">升降号</div>
        <div className="note-tool-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {ACCIDENTALS.map(a => (
            <button
              key={a.key ?? 'none'}
              className={`note-tool-btn ${store.selectedAccidental === a.key ? 'active' : ''}`}
              onClick={() => store.setSelectedAccidental(a.key)}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="section-title">节拍器</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ margin: 0 }}>启用</label>
          <Switch
            checked={store.metronomeEnabled}
            onChange={(c) => store.setMetronomeEnabled(c)}
          />
        </div>
        <label style={{ marginTop: 8 }}>音量: {store.metronomeVolume} dB</label>
        <Slider
          min={-40}
          max={0}
          value={store.metronomeVolume}
          onChange={(v) => store.setMetronomeVolume(v as number)}
        />

        <div className="section-title">提示</div>
        <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.7 }}>
          • 点击五线谱在当前声部添加音符<br/>
          • 音符位置越靠上音高越高<br/>
          • 选择正确的声部和时值再点击<br/>
          • 红色文字表示升降记号
        </div>
      </div>

      <div className="score-canvas-area">
        <div className="voice-headers">
          {VOICES.map(v => (
            <div
              key={v}
              className={`voice-header ${store.activeVoice === v ? '' : 'inactive'}`}
              onClick={() => store.setActiveVoice(v)}
              style={{ cursor: 'pointer' }}
            >
              {v} ({store.project.voices.find(x => x.name === v)?.clef === 'treble' ? '高音谱' : '低音谱'})
            </div>
          ))}
        </div>

        {store.project.voices.map((voice, idx) => (
          <div key={voice.name} className="staff-container" style={{ position: 'relative' }}>
            <div className="staff-label">{voice.name}</div>
            <svg
              ref={(el) => { svgRefs.current[idx] = el; }}
              className="vexflow-svg"
              style={{ width: '100%', minHeight: 150, cursor: store.activeVoice === voice.name ? 'crosshair' : 'default' }}
              onClick={(e) => handleStaffClick(e, voice.name)}
            />
            {idx < store.project.voices.length - 1 && (
              <div className="staff-divider" style={{ bottom: -8 }} />
            )}
          </div>
        ))}

        {store.project.voices.every(v => v.notes.length === 0) && (
          <div className="empty-state">
            <p>暂无音符，请在左侧面板选择声部、时值和升降号，然后点击五线谱添加音符。</p>
          </div>
        )}
      </div>

      {store.metronomeEnabled && (
        <div
          className={`metronome-indicator ${store.metronomeBeat > 0 ? 'pulse' : ''}`}
          key={store.metronomeBeat}
        />
      )}
    </div>
  );
}

export default ScoreEditor;
