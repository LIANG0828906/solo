import { useState, useEffect, useCallback, useRef } from 'react';
import { useSceneStore, GeometryType, ColorPreset, TransformType, RotationAxis, CommandAction } from '@/stores/sceneStore';

interface ParsedCommand {
  type: 'create' | 'transform';
  geometryType?: GeometryType;
  color?: ColorPreset;
  transformType?: TransformType;
  transformData?: {
    offset?: { x: number; y: number; z: number };
    scale?: number;
    rotationAxis?: RotationAxis;
    rotationSpeed?: number;
  };
}

const GEOMETRY_MAP: Record<string, GeometryType> = {
  '立方体': 'cube', '方块': 'cube', 'cube': 'cube', 'box': 'cube', '方体': 'cube',
  '球体': 'sphere', '球': 'sphere', 'sphere': 'sphere', 'ball': 'sphere',
  '圆锥': 'cone', '锥体': 'cone', 'cone': 'cone',
  '圆环': 'torus', '环形': 'torus', 'torus': 'torus', 'ring': 'torus',
  '圆柱': 'cylinder', '圆柱体': 'cylinder', 'cylinder': 'cylinder',
};

const COLOR_MAP: Record<string, ColorPreset> = {
  '红色': '#FF6B6B', '红': '#FF6B6B', 'red': '#FF6B6B',
  '蓝色': '#4FC3F7', '蓝': '#4FC3F7', 'blue': '#4FC3F7',
  '黄色': '#FFD93D', '黄': '#FFD93D', 'yellow': '#FFD93D',
  '绿色': '#6BCB77', '绿': '#6BCB77', 'green': '#6BCB77',
  '紫色': '#A66CFF', '紫': '#A66CFF', 'purple': '#A66CFF',
};

const TRANSFORM_MAP: Record<string, TransformType> = {
  '移动': 'move', '平移': 'move', 'move': 'move', 'translate': 'move',
  '放大': 'scale', '缩小': 'scale', '缩放': 'scale', 'scale': 'scale', 'resize': 'scale',
  '旋转': 'rotate', '转动': 'rotate', 'rotate': 'rotate', 'spin': 'rotate',
};

const AXIS_MAP: Record<string, RotationAxis> = {
  'x': 'x', 'X': 'x', 'x轴': 'x', 'X轴': 'x',
  'y': 'y', 'Y': 'y', 'y轴': 'y', 'Y轴': 'y',
  'z': 'z', 'Z': 'z', 'z轴': 'z', 'Z轴': 'z',
};

const COLOR_PRESETS: ColorPreset[] = ['#FF6B6B', '#4FC3F7', '#FFD93D', '#6BCB77', '#A66CFF'];
const GEOMETRY_TYPES: GeometryType[] = ['cube', 'sphere', 'cone', 'torus', 'cylinder'];

const randomOffset = () => ({
  x: (Math.random() - 0.5) * 6,
  y: (Math.random() - 0.5) * 6,
  z: (Math.random() - 0.5) * 6,
});

const randomScale = () => 0.5 + Math.random() * 1.5;

const randomAxis = (): RotationAxis => {
  const axes: RotationAxis[] = ['x', 'y', 'z'];
  return axes[Math.floor(Math.random() * axes.length)];
};

const randomSpeed = () => 0.5 + Math.random() * 1.5;

const parseCommand = (text: string): ParsedCommand | null => {
  const lowerText = text.toLowerCase().trim();

  let geometryType: GeometryType | undefined;
  for (const [key, value] of Object.entries(GEOMETRY_MAP)) {
    if (lowerText.includes(key.toLowerCase())) {
      geometryType = value;
      break;
    }
  }

  let color: ColorPreset | undefined;
  for (const [key, value] of Object.entries(COLOR_MAP)) {
    if (lowerText.includes(key.toLowerCase())) {
      color = value;
      break;
    }
  }

  let transformType: TransformType | undefined;
  for (const [key, value] of Object.entries(TRANSFORM_MAP)) {
    if (lowerText.includes(key.toLowerCase())) {
      transformType = value;
      break;
    }
  }

  if (geometryType && !transformType) {
    return {
      type: 'create',
      geometryType,
      color: color || COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)],
    };
  }

  if (transformType) {
    const transformData: NonNullable<ParsedCommand['transformData']> = {};

    if (transformType === 'move') {
      transformData.offset = randomOffset();
    } else if (transformType === 'scale') {
      let scale = randomScale();
      if (lowerText.includes('两倍') || lowerText.includes('2倍') || lowerText.includes('double')) {
        scale = 2;
      } else if (lowerText.includes('一半') || lowerText.includes('半') || lowerText.includes('half')) {
        scale = 0.5;
      }
      transformData.scale = scale;
    } else if (transformType === 'rotate') {
      let rotationAxis: RotationAxis = randomAxis();
      for (const [key, value] of Object.entries(AXIS_MAP)) {
        if (lowerText.includes(key.toLowerCase())) {
          rotationAxis = value;
          break;
        }
      }
      transformData.rotationAxis = rotationAxis;
      transformData.rotationSpeed = randomSpeed();
    }

    return {
      type: 'transform',
      transformType,
      transformData,
    };
  }

  return null;
};

const generateId = () => Math.random().toString(36).substring(2, 11);

interface UseSpeechToCommandReturn {
  isRecording: boolean;
  currentTranscript: string;
  lastError: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  toggleRecording: () => void;
  isSupported: boolean;
}

export const useSpeechToCommand = (): UseSpeechToCommandReturn => {
  const [isSupported, setIsSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastError, setLastError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  const addObject = useSceneStore((state) => state.addObject);
  const updateObject = useSceneStore((state) => state.updateObject);
  const objects = useSceneStore((state) => state.objects);
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId);
  const showError = useSceneStore((state) => state.showError);
  const setRecording = useSceneStore((state) => state.setRecording);
  const setCurrentCommand = useSceneStore((state) => state.setCurrentCommand);
  const addCommandToHistory = useSceneStore((state) => state.addCommandToHistory);
  const commandHistory = useSceneStore((state) => state.commandHistory);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';

    recognition.onstart = () => {
      setIsRecording(true);
      setRecording(true);
      finalTranscriptRef.current = '';
      setCurrentTranscript('');
    };

    recognition.onend = () => {
      setIsRecording(false);
      setRecording(false);
      const finalText = finalTranscriptRef.current.trim();
      if (finalText) {
        processCommand(finalText);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setRecording(false);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setLastError(`语音识别错误: ${event.error}`);
        setTimeout(() => setLastError(null), 2000);
      }
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      const fullText = (finalTranscriptRef.current + interimTranscript).trim();
      setCurrentTranscript(fullText);
      setCurrentCommand(fullText);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const processCommand = useCallback((text: string) => {
    const parsed = parseCommand(text);
    if (!parsed) {
      showError(`无法识别指令: "${text}"。请尝试: "创建一个红色立方体"、"放大球体"、"绕Y轴旋转"`);
      return;
    }

    const baseTimestamp = commandHistory.length > 0 ? commandHistory[0].timestamp : Date.now();
    const timestamp = Date.now();

    if (parsed.type === 'create') {
      const objectId = addObject({
        type: parsed.geometryType!,
        color: parsed.color!,
        position: { x: 0, y: 0.5, z: 0 },
        targetPosition: { x: 0, y: 0.5, z: 0 },
        scale: 1,
        targetScale: 1,
        rotation: { x: 0, y: 0, z: 0 },
        rotationSpeed: { x: 0, y: 0, z: 0 },
      });

      const action: CommandAction = {
        id: generateId(),
        timestamp: timestamp - baseTimestamp,
        type: 'create',
        objectId,
        geometryType: parsed.geometryType,
        color: parsed.color,
        originalText: text,
      };
      addCommandToHistory(action);
    } else if (parsed.type === 'transform') {
      const targetId = selectedObjectId || (objects.length > 0 ? objects[objects.length - 1].id : null);
      if (!targetId) {
        showError('没有可变换的物体，请先创建一个几何体');
        return;
      }

      const currentObj = objects.find((o) => o.id === targetId);
      if (!currentObj) {
        showError('未找到目标物体');
        return;
      }

      const transformData = parsed.transformData!;
      if (parsed.transformType === 'move' && transformData.offset) {
        updateObject(targetId, {
          targetPosition: {
            x: currentObj.targetPosition.x + transformData.offset.x,
            y: Math.max(0.5, currentObj.targetPosition.y + transformData.offset.y),
            z: currentObj.targetPosition.z + transformData.offset.z,
          },
          activeTransform: 'move',
          transformIntensity: 1,
        });
      } else if (parsed.transformType === 'scale' && transformData.scale) {
        updateObject(targetId, {
          targetScale: Math.max(0.2, Math.min(5, currentObj.targetScale * transformData.scale)),
          activeTransform: 'scale',
          transformIntensity: 1,
        });
      } else if (parsed.transformType === 'rotate' && transformData.rotationAxis && transformData.rotationSpeed) {
        const axis = transformData.rotationAxis;
        const currentSpeed = { ...currentObj.rotationSpeed };
        if (currentSpeed[axis] === 0) {
          currentSpeed[axis] = transformData.rotationSpeed;
        } else {
          currentSpeed[axis] = 0;
        }
        updateObject(targetId, {
          rotationSpeed: currentSpeed,
          activeTransform: 'rotate',
          transformIntensity: 1,
        });
      }

      const action: CommandAction = {
        id: generateId(),
        timestamp: timestamp - baseTimestamp,
        type: 'transform',
        objectId: targetId,
        transformType: parsed.transformType,
        transformData: parsed.transformData,
        originalText: text,
      };
      addCommandToHistory(action);
    }

    setCurrentCommand(text);
  }, [addObject, updateObject, objects, selectedObjectId, showError, setCurrentCommand, addCommandToHistory, commandHistory]);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) {
      setLastError('浏览器不支持语音识别，请使用Chrome浏览器');
      showError('浏览器不支持语音识别，请使用Chrome浏览器');
      return;
    }
    try {
      finalTranscriptRef.current = '';
      setCurrentTranscript('');
      recognitionRef.current.start();
    } catch (e: any) {
      console.error('Failed to start recording:', e);
    }
  }, [showError]);

  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e: any) {
      console.error('Failed to stop recording:', e);
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    currentTranscript,
    lastError,
    startRecording,
    stopRecording,
    toggleRecording,
    isSupported,
  };
};
