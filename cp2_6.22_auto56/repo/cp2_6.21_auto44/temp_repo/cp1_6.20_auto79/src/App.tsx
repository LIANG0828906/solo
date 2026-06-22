import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Viewport3D } from './components/Viewport3D';
import { UVViewport } from './components/UVViewport';
import { ControlPanel } from './components/ControlPanel';
import { InfoPanel } from './components/InfoPanel';
import type { ModelData, UIParams, SelectionState } from './types';
import { parseOBJ, createDefaultCube, validateTriangles } from './utils/uvUnwrapper';

const App: React.FC = () => {
  const [modelData, setModelData] = useState<ModelData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [uiParams, setUiParams] = useState<UIParams>({
    checkerboardDensity: 16,
    borderWidth: 1,
    showWireframe: false,
  });
  const [selection, setSelection] = useState<SelectionState>({
    selectedFaceIndices: [],
    selectedVertexIndex: null,
    isDragging: false,
  });
  const [isValid, setIsValid] = useState(true);
  const [validationMessage, setValidationMessage] = useState('所有面片合法');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const defaultCube = createDefaultCube();
    setModelData(defaultCube);
    setFileName('cube.obj');
    const validation = validateTriangles(defaultCube.uvs, defaultCube.faces);
    setIsValid(validation.valid);
    setValidationMessage(validation.message);
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const parsed = parseOBJ(content);
        setModelData(parsed);
        setFileName(file.name);
        setSelection({
          selectedFaceIndices: [],
          selectedVertexIndex: null,
          isDragging: false,
        });

        const validation = validateTriangles(parsed.uvs, parsed.faces);
        setIsValid(validation.valid);
        setValidationMessage(validation.message);
      } catch (err) {
        console.error('Failed to parse OBJ:', err);
        alert('文件解析失败，请检查OBJ文件格式');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleParamsChange = useCallback((params: Partial<UIParams>) => {
    setUiParams((prev) => ({ ...prev, ...params }));
  }, []);

  const handleFaceClick = useCallback((faceIndex: number, isMultiSelect: boolean) => {
    setSelection((prev) => {
      if (isMultiSelect) {
        const exists = prev.selectedFaceIndices.includes(faceIndex);
        if (exists) {
          return {
            ...prev,
            selectedFaceIndices: prev.selectedFaceIndices.filter((i) => i !== faceIndex),
          };
        } else {
          return {
            ...prev,
            selectedFaceIndices: [...prev.selectedFaceIndices, faceIndex],
          };
        }
      } else {
        return {
          ...prev,
          selectedFaceIndices: [faceIndex],
        };
      }
    });
  }, []);

  const handleDeselectFace = useCallback((faceIndex: number) => {
    setSelection((prev) => ({
      ...prev,
      selectedFaceIndices: prev.selectedFaceIndices.filter((i) => i !== faceIndex),
    }));
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelection((prev) => ({
      ...prev,
      selectedFaceIndices: [],
    }));
  }, []);

  const handleVertexDragEnd = useCallback((vertexIndex: number, newU: number, newV: number) => {
    setModelData((prev) => {
      if (!prev) return prev;

      const newUVs = [...prev.uvs];
      newUVs[vertexIndex] = { u: newU, v: newV };

      const newModel = {
        ...prev,
        uvs: newUVs,
      };

      const validation = validateTriangles(newUVs, prev.faces);
      setIsValid(validation.valid);
      setValidationMessage(validation.message);

      return newModel;
    });
  }, []);

  const handleValidationChange = useCallback((valid: boolean, message: string) => {
    setIsValid(valid);
    setValidationMessage(message);
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#1a1a2e',
        color: '#ccccdd',
        fontFamily:
          "'Segoe UI', system-ui, -apple-system, sans-serif",
        overflow: 'hidden',
      }}
    >
      <ControlPanel
        uiParams={uiParams}
        onParamsChange={handleParamsChange}
        onFileUpload={handleFileUpload}
        isValid={isValid}
        validationMessage={validationMessage}
        fileName={fileName}
        faceCount={modelData?.faceCount || 0}
        vertexCount={modelData?.vertexCount || 0}
      />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
        className="main-content"
      >
        <div
          style={{
            flex: '0 0 60%',
            position: 'relative',
            borderRight: '1px solid rgba(100, 100, 150, 0.2)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              padding: '6px 12px',
              background: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(8px)',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#8888aa',
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            3D 视图
          </div>
          <Viewport3D
            modelData={modelData}
            selection={selection}
            uiParams={uiParams}
            onFaceClick={handleFaceClick}
          />
        </div>

        <div
          style={{
            flex: '0 0 40%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'relative',
              flex: 1,
              minHeight: 0,
              borderBottom: '1px solid rgba(100, 100, 150, 0.2)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                padding: '6px 12px',
                background: 'rgba(26, 26, 46, 0.8)',
                backdropFilter: 'blur(8px)',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#8888aa',
                zIndex: 5,
                pointerEvents: 'none',
              }}
            >
              UV 展开图
            </div>
            <UVViewport
              modelData={modelData}
              selection={selection}
              uiParams={uiParams}
              onFaceClick={handleFaceClick}
              onVertexDragEnd={handleVertexDragEnd}
              onValidationChange={handleValidationChange}
            />
          </div>

          <div
            style={{
              padding: '12px',
              maxHeight: '40%',
              overflow: 'hidden',
            }}
          >
            <InfoPanel
              modelData={modelData}
              selectedFaceIndices={selection.selectedFaceIndices}
              onDeselectFace={handleDeselectFace}
              onClearSelection={handleClearSelection}
            />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .main-content {
            flex-direction: column !important;
          }
          .main-content > div:first-child {
            flex: 0 0 50% !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(100, 100, 150, 0.2);
          }
          .main-content > div:last-child {
            flex: 0 0 50% !important;
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          background: #444466;
          border-radius: 2px;
          outline: none;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #00d4ff;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 212, 255, 0.4);
          transition: transform 0.2s ease;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #00d4ff;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 212, 255, 0.4);
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(30, 30, 50);
        }

        ::-webkit-scrollbar-thumb {
          background: #555577;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #666688;
        }
      `}</style>
    </div>
  );
};

export default App;
