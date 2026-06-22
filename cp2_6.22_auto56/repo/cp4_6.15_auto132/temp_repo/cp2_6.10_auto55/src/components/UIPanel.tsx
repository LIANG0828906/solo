import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, calculateMatchPercentage } from "../store";
import {
  UnitType,
  FormationType,
  UNIT_NAMES,
  UNIT_COLORS,
  FORMATION_NAMES,
  UNIT_COUNTS,
} from "../types";

const UnitCard: React.FC<{
  type: UnitType;
  count: number;
  onDragStart: (e: any, type: UnitType) => void;
}> = ({ type, count, onDragStart }) => {
  return (
    <motion.div
      draggable={count > 0}
      onDragStart={(e) => onDragStart(e, type)}
      whileHover={{ scale: count > 0 ? 1.05 : 1 }}
      whileTap={{ scale: count > 0 ? 0.95 : 1 }}
      style={{
        width: "100%",
        padding: "12px",
        background:
          "radial-gradient(circle at 30% 30%, #8b7355 0%, #5a3e1a 100%)",
        borderRadius: "8px",
        boxShadow: "2px 2px 8px rgba(0,0,0,0.3)",
        cursor: count > 0 ? "grab" : "not-allowed",
        opacity: count > 0 ? 1 : 0.5,
        marginBottom: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "4px",
              backgroundColor: UNIT_COLORS[type],
              border: "2px solid #3a2a1a",
            }}
          />
          <span
            style={{
              color: "#f0e6d0",
              fontSize: "14px",
              fontWeight: "bold",
              fontFamily: '"Noto Serif SC", serif',
            }}
          >
            {UNIT_NAMES[type]}
          </span>
        </div>
        <span
          style={{
            color: "#f0e6d0",
            fontSize: "16px",
            fontWeight: "bold",
            fontFamily: '"ZCOOL XiaoWei", serif',
          }}
        >
          {count}/{UNIT_COUNTS[type]}
        </span>
      </div>
    </motion.div>
  );
};

const FormationButton: React.FC<{
  formation: FormationType;
  isActive: boolean;
  onClick: () => void;
}> = ({ formation, isActive, onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ backgroundColor: isActive ? "#6b4e3a" : "#5a4a3a" }}
      whileTap={{ scale: 0.95 }}
      style={{
        width: "40px",
        height: "40px",
        backgroundColor: isActive ? "#6b4e3a" : "#4a3a2a",
        border: isActive ? "2px solid #8b7355" : "2px solid #3a2a1a",
        borderRadius: "4px",
        color: "#f0e6d0",
        fontSize: "12px",
        fontWeight: "bold",
        cursor: "pointer",
        fontFamily: '"Noto Serif SC", serif',
        boxShadow: isActive
          ? "inset 1px 1px 3px rgba(0,0,0,0.5)"
          : "2px 2px 4px rgba(0,0,0,0.3)",
      }}
      title={FORMATION_NAMES[formation]}
    >
      {formation === FormationType.SQUARE ? "方" : formation === FormationType.GOOSE ? "雁" : "锋"}
    </motion.button>
  );
};

const CircularProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 80) return "#33cc33";
    if (percentage >= 60) return "#ffcc00";
    if (percentage >= 40) return "#ff9933";
    return "#cc3333";
  };

  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      <circle
        cx="30"
        cy="30"
        r={radius}
        fill="none"
        stroke="#3a2a1a"
        strokeWidth="5"
      />
      <circle
        cx="30"
        cy="30"
        r={radius}
        fill="none"
        stroke={getColor()}
        strokeWidth="5"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 30 30)"
        style={{ transition: "stroke-dashoffset 0.3s ease, stroke 0.3s ease" }}
      />
      <text
        x="30"
        y="35"
        textAnchor="middle"
        fill="#f0e6d0"
        fontSize="14"
        fontWeight="bold"
        fontFamily='"ZCOOL XiaoWei", serif'
      >
        {Math.round(percentage)}%
      </text>
    </svg>
  );
};

const TigerTalismanWarning: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
          opacity: [0, 1, 0, 1, 0, 1, 0],
          scale: [0.5, 1.1, 0.9, 1.1, 0.9, 1.1, 0.5],
        }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ duration: 1.5 }}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1000,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: "120px",
            height: "80px",
            background:
              "linear-gradient(135deg, #ffcc00 0%, #ff9900 100%)",
            borderRadius: "8px",
            border: "3px solid #8b4513",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 30px rgba(255, 204, 0, 0.8)",
            opacity: 0.8,
          }}
        >
          <span
            style={{
              fontSize: "24px",
              color: "#4a2a0a",
              fontWeight: "bold",
              fontFamily: '"Noto Serif SC", serif',
            }}
          >
            虎符警告
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const UIPanel: React.FC = () => {
  const {
    units,
    score,
    transformationTime,
    currentFormation,
    matchPercentage,
    remainingUnits,
    recordedFrames,
    isRecording,
    isPlaying,
    playhead,
    playSpeed,
    setCurrentFormation,
    setIsRecording,
    setIsPlaying,
    setPlayhead,
    setPlaySpeed,
    setMatchPercentage,
    clearRecordedFrames,
    setUnits,
  } = useStore();

  const [showWarning, setShowWarning] = useState(false);
  const [showScorePopup, setShowScorePopup] = useState<string | null>(null);
  const playIntervalRef = useRef<number | null>(null);
  const warningTimeoutRef = useRef<number | null>(null);

  const handleDragStart = (e: any, type: UnitType) => {
    e.dataTransfer.setData("unitType", type);
  };

  const handleFormationClick = (formation: FormationType) => {
    if (units.length === 0) return;
    setCurrentFormation(formation);

    const match = calculateMatchPercentage(units, formation);
    setMatchPercentage(match);
  };

  useEffect(() => {
    if (currentFormation && matchPercentage < 70 && units.length > 0) {
      setShowWarning(true);
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(false);
      }, 2000);
    }
  }, [matchPercentage, currentFormation, units.length]);

  useEffect(() => {
    if (currentFormation && matchPercentage >= 80) {
      setShowScorePopup("优秀 +10");
      setTimeout(() => setShowScorePopup(null), 2000);
    } else if (currentFormation && matchPercentage >= 60) {
      setShowScorePopup("良好 +5");
      setTimeout(() => setShowScorePopup(null), 2000);
    } else if (currentFormation && matchPercentage >= 40) {
      setShowScorePopup("一般 +1");
      setTimeout(() => setShowScorePopup(null), 2000);
    }
  }, [currentFormation]);

  const handleRecordingToggle = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      clearRecordedFrames();
      setIsRecording(true);
    }
  };

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    } else {
      if (recordedFrames.length === 0) return;
      setIsPlaying(true);

      const frameInterval = 100 / playSpeed;
      playIntervalRef.current = window.setInterval(() => {
        const currentFrame = useStore.getState().playhead;
        if (currentFrame >= recordedFrames.length - 1) {
          setIsPlaying(false);
          if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current);
            playIntervalRef.current = null;
          }
          return;
        }

        const nextFrame = currentFrame + 1;
        setPlayhead(nextFrame);

        const frame = recordedFrames[nextFrame];
        if (frame) {
          const newUnits = units.map((unit) => {
            const frameUnit = frame.units.find((u) => u.id === unit.id);
            if (frameUnit) {
              return {
                ...unit,
                x: frameUnit.x,
                z: frameUnit.z,
                rotation: frameUnit.rotation,
                state: frameUnit.state,
              };
            }
            return unit;
          });
          setUnits(newUnits);
        }
      }, frameInterval);
    }
  };

  const handlePlayheadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHead = parseInt(e.target.value);
    setPlayhead(newHead);

    const frame = recordedFrames[newHead];
    if (frame) {
      const newUnits = units.map((unit) => {
        const frameUnit = frame.units.find((u) => u.id === unit.id);
        if (frameUnit) {
          return {
            ...unit,
            x: frameUnit.x,
            z: frameUnit.z,
            rotation: frameUnit.rotation,
            state: frameUnit.state,
          };
        }
        return unit;
      });
      setUnits(newUnits);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaySpeed(speed);
    if (isPlaying && playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      const frameInterval = 100 / speed;
      playIntervalRef.current = window.setInterval(() => {
        const currentFrame = useStore.getState().playhead;
        if (currentFrame >= recordedFrames.length - 1) {
          setIsPlaying(false);
          if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current);
            playIntervalRef.current = null;
          }
          return;
        }

        const nextFrame = currentFrame + 1;
        setPlayhead(nextFrame);

        const frame = recordedFrames[nextFrame];
        if (frame) {
          const newUnits = units.map((unit) => {
            const frameUnit = frame.units.find((u) => u.id === unit.id);
            if (frameUnit) {
              return {
                ...unit,
                x: frameUnit.x,
                z: frameUnit.z,
                rotation: frameUnit.rotation,
                state: frameUnit.state,
              };
            }
            return unit;
          });
          setUnits(newUnits);
        }
      }, frameInterval);
    }
  };

  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, []);

  const getMatchGrade = () => {
    if (matchPercentage >= 80) return "优秀";
    if (matchPercentage >= 60) return "良好";
    if (matchPercentage >= 40) return "一般";
    return "";
  };

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          padding: "15px 25px",
          backgroundColor: "rgba(74, 58, 42, 0.9)",
          borderRadius: "8px",
          boxShadow: "3px 3px 10px rgba(0,0,0,0.4)",
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "30px",
            fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif',
          }}
        >
          <div>
            <span
              style={{ color: "#c8b298", fontSize: "14px", display: "block" }}
            >
              积分
            </span>
            <span
              style={{
                color: "#f0e6d0",
                fontSize: "20px",
                fontWeight: "bold",
                fontFamily: '"ZCOOL XiaoWei", serif',
              }}
            >
              {score}
            </span>
          </div>
          <div>
            <span
              style={{ color: "#c8b298", fontSize: "14px", display: "block" }}
            >
              变阵耗时
            </span>
            <span
              style={{
                color: "#f0e6d0",
                fontSize: "20px",
                fontWeight: "bold",
                fontFamily: '"ZCOOL XiaoWei", serif',
              }}
            >
              {transformationTime.toFixed(1)}s
            </span>
          </div>
        </div>
        <AnimatePresence>
          {showScorePopup && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                position: "absolute",
                top: "-30px",
                left: "50%",
                transform: "translateX(-50%)",
                color: "#ffcc00",
                fontSize: "16px",
                fontWeight: "bold",
                textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
              }}
            >
              {showScorePopup}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          display: "flex",
          gap: "10px",
          zIndex: 100,
        }}
      >
        <FormationButton
          formation={FormationType.SQUARE}
          isActive={currentFormation === FormationType.SQUARE}
          onClick={() => handleFormationClick(FormationType.SQUARE)}
        />
        <FormationButton
          formation={FormationType.GOOSE}
          isActive={currentFormation === FormationType.GOOSE}
          onClick={() => handleFormationClick(FormationType.GOOSE)}
        />
        <FormationButton
          formation={FormationType.ARROW}
          isActive={currentFormation === FormationType.ARROW}
          onClick={() => handleFormationClick(FormationType.ARROW)}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: "20px",
          top: "120px",
          width: "160px",
          zIndex: 100,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(74, 58, 42, 0.9)",
            padding: "15px",
            borderRadius: "8px",
            boxShadow: "3px 3px 10px rgba(0,0,0,0.4)",
          }}
        >
          <h3
            style={{
              color: "#f0e6d0",
              fontSize: "16px",
              marginBottom: "15px",
              textAlign: "center",
              fontFamily: '"Noto Serif SC", serif',
              borderBottom: "1px solid #6b4e3a",
              paddingBottom: "8px",
            }}
          >
            兵 牌
          </h3>
          {(Object.keys(remainingUnits) as UnitType[]).map((type) => (
            <UnitCard
              key={type}
              type={type}
              count={remainingUnits[type]}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: "20px",
          top: "100px",
          width: "180px",
          zIndex: 100,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(74, 58, 42, 0.9)",
            padding: "15px",
            borderRadius: "8px",
            boxShadow: "3px 3px 10px rgba(0,0,0,0.4)",
          }}
        >
          <h3
            style={{
              color: "#f0e6d0",
              fontSize: "16px",
              marginBottom: "15px",
              textAlign: "center",
              fontFamily: '"Noto Serif SC", serif',
              borderBottom: "1px solid #6b4e3a",
              paddingBottom: "8px",
            }}
          >
            阵型状态
          </h3>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
            <CircularProgress percentage={matchPercentage} />
          </div>

          {currentFormation && matchPercentage >= 40 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                textAlign: "center",
                padding: "8px",
                backgroundColor: "rgba(107, 78, 58, 0.5)",
                borderRadius: "4px",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  color:
                    matchPercentage >= 80
                      ? "#33cc33"
                      : matchPercentage >= 60
                      ? "#ffcc00"
                      : "#ff9933",
                  fontSize: "14px",
                  fontWeight: "bold",
                  fontFamily: '"Noto Serif SC", serif',
                }}
              >
                阵型完成度：{getMatchGrade()}
              </span>
            </motion.div>
          )}

          {currentFormation && (
            <div
              style={{
                textAlign: "center",
                color: "#c8b298",
                fontSize: "12px",
                fontFamily: '"Noto Serif SC", serif',
              }}
            >
              当前阵型：{FORMATION_NAMES[currentFormation]}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          zIndex: 100,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(74, 58, 42, 0.9)",
            padding: "15px 25px",
            borderRadius: "8px",
            boxShadow: "3px 3px 10px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              marginBottom: "10px",
            }}
          >
            <motion.button
              onClick={handleRecordingToggle}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: "8px 16px",
                backgroundColor: isRecording ? "#cc3333" : "#6b4e3a",
                border: "none",
                borderRadius: "4px",
                color: "#f0e6d0",
                fontSize: "14px",
                cursor: "pointer",
                fontFamily: '"Noto Serif SC", serif',
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: isRecording ? "#ff6666" : "#ff9999",
                }}
              />
              {isRecording ? "停止录制" : "开始录制"}
            </motion.button>

            <motion.button
              onClick={handlePlayToggle}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={recordedFrames.length === 0}
              style={{
                padding: "8px 16px",
                backgroundColor:
                  recordedFrames.length === 0 ? "#3a2a1a" : isPlaying ? "#3366cc" : "#6b4e3a",
                border: "none",
                borderRadius: "4px",
                color: "#f0e6d0",
                fontSize: "14px",
                cursor: recordedFrames.length === 0 ? "not-allowed" : "pointer",
                fontFamily: '"Noto Serif SC", serif',
              }}
            >
              {isPlaying ? "暂停" : "回放"}
            </motion.button>

            <div style={{ display: "flex", gap: "5px" }}>
              {[0.5, 1, 2].map((speed) => (
                <motion.button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: "6px 10px",
                    backgroundColor: playSpeed === speed ? "#3366cc" : "#5a4a3a",
                    border: "none",
                    borderRadius: "4px",
                    color: "#f0e6d0",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontFamily: '"Noto Serif SC", serif',
                  }}
                >
                  {speed}x
                </motion.button>
              ))}
            </div>

            <motion.button
              onClick={clearRecordedFrames}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={recordedFrames.length === 0}
              style={{
                padding: "8px 16px",
                backgroundColor:
                  recordedFrames.length === 0 ? "#3a2a1a" : "#6b4e3a",
                border: "none",
                borderRadius: "4px",
                color: "#f0e6d0",
                fontSize: "14px",
                cursor: recordedFrames.length === 0 ? "not-allowed" : "pointer",
                fontFamily: '"Noto Serif SC", serif',
              }}
            >
              清除
            </motion.button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="range"
              min="0"
              max={Math.max(0, recordedFrames.length - 1)}
              value={playhead}
              onChange={handlePlayheadChange}
              disabled={recordedFrames.length === 0}
              style={{
                flex: 1,
                accentColor: "#8b7355",
                cursor: recordedFrames.length === 0 ? "not-allowed" : "pointer",
              }}
            />
            <span
              style={{
                color: "#f0e6d0",
                fontSize: "12px",
                minWidth: "60px",
                textAlign: "right",
                fontFamily: '"ZCOOL XiaoWei", serif',
              }}
            >
              帧 {playhead}/{Math.max(0, recordedFrames.length - 1)}
            </span>
          </div>
        </div>
      </div>

      <TigerTalismanWarning show={showWarning} />
    </>
  );
};

export default UIPanel;
