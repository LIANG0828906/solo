import React, { useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { PuppetCharacter, CharacterPart, Joint, JOINT_LIMITS, JointType, PartType } from '../types';

interface CharacterRigProps {
  character: PuppetCharacter;
  onJointChange?: (characterId: string, jointId: string, angle: number) => void;
  onPositionChange?: (characterId: string, x: number, y: number) => void;
  onPartDragStart?: (partId: string) => void;
  onPartDragEnd?: (partId: string, x: number, y: number) => void;
  isDragging?: boolean;
  showJoints?: boolean;
  lampBrightness: number;
}

const CHARACTER_COLORS: Record<string, string> = {
  '孙悟空': '#d32f2f',
  '唐僧': '#fbc02d',
  '猪八戒': '#689f38',
  '沙僧': '#5d4037',
  '白骨精': '#ba68c8',
  '村姑': '#e91e63',
  '老翁': '#795548',
  '老妇': '#9e9e9e',
};

const createCharacterParts = (name: string): CharacterPart[] => {
  const color = CHARACTER_COLORS[name] || '#8d6e63';
  const baseId = uuidv4();
  
  return [
    {
      id: `${baseId}-head`,
      type: 'head',
      x: 0,
      y: -120,
      rotation: 0,
      width: 50,
      height: 60,
      color,
      connected: true,
    },
    {
      id: `${baseId}-upperBody`,
      type: 'upperBody',
      x: 0,
      y: -60,
      rotation: 0,
      width: 70,
      height: 80,
      color,
      connected: true,
    },
    {
      id: `${baseId}-lowerBody`,
      type: 'lowerBody',
      x: 0,
      y: 20,
      rotation: 0,
      width: 60,
      height: 70,
      color,
      connected: true,
    },
    {
      id: `${baseId}-leftArm`,
      type: 'leftArm',
      x: -50,
      y: -50,
      rotation: -30,
      width: 25,
      height: 80,
      color,
      connected: true,
    },
    {
      id: `${baseId}-rightArm`,
      type: 'rightArm',
      x: 50,
      y: -50,
      rotation: 30,
      width: 25,
      height: 80,
      color,
      connected: true,
    },
  ];
};

const createCharacterJoints = (): Joint[] => {
  const baseId = uuidv4();
  
  return [
    {
      id: `${baseId}-neck`,
      type: 'head',
      angle: 0,
      minAngle: JOINT_LIMITS.head.min,
      maxAngle: JOINT_LIMITS.head.max,
      x: 0,
      y: -90,
    },
    {
      id: `${baseId}-leftShoulder`,
      type: 'upperArm',
      angle: -30,
      minAngle: JOINT_LIMITS.upperArm.min,
      maxAngle: JOINT_LIMITS.upperArm.max,
      x: -35,
      y: -60,
    },
    {
      id: `${baseId}-rightShoulder`,
      type: 'upperArm',
      angle: 30,
      minAngle: JOINT_LIMITS.upperArm.min,
      maxAngle: JOINT_LIMITS.upperArm.max,
      x: 35,
      y: -60,
    },
    {
      id: `${baseId}-leftElbow`,
      type: 'lowerArm',
      angle: 0,
      minAngle: JOINT_LIMITS.lowerArm.min,
      maxAngle: JOINT_LIMITS.lowerArm.max,
      x: -55,
      y: -20,
    },
    {
      id: `${baseId}-rightElbow`,
      type: 'lowerArm',
      angle: 0,
      minAngle: JOINT_LIMITS.lowerArm.min,
      maxAngle: JOINT_LIMITS.lowerArm.max,
      x: 55,
      y: -20,
    },
    {
      id: `${baseId}-leftHip`,
      type: 'leg',
      angle: 0,
      minAngle: JOINT_LIMITS.leg.min,
      maxAngle: JOINT_LIMITS.leg.max,
      x: -20,
      y: 50,
    },
    {
      id: `${baseId}-rightHip`,
      type: 'leg',
      angle: 0,
      minAngle: JOINT_LIMITS.leg.min,
      maxAngle: JOINT_LIMITS.leg.max,
      x: 20,
      y: 50,
    },
  ];
};

export const initializeCharacter = (name: string, role: PuppetCharacter['role']): PuppetCharacter => {
  return {
    id: uuidv4(),
    name,
    role,
    parts: createCharacterParts(name),
    joints: createCharacterJoints(),
    position: { x: 400, y: 300 },
    isOnStage: false,
  };
};

const renderPartPath = (type: PartType, width: number, height: number): string => {
  switch (type) {
    case 'head':
      return `M ${width/2} 0 
              Q ${width} ${height*0.2} ${width*0.9} ${height*0.6}
              Q ${width*0.8} ${height} ${width/2} ${height}
              Q ${width*0.2} ${height} ${width*0.1} ${height*0.6}
              Q 0 ${height*0.2} ${width/2} 0`;
    case 'upperBody':
      return `M ${width*0.3} 0 
              L ${width*0.7} 0
              L ${width} ${height*0.3}
              L ${width*0.9} ${height*0.8}
              L ${width*0.1} ${height*0.8}
              L 0 ${height*0.3}
              Z`;
    case 'lowerBody':
      return `M ${width*0.2} 0
              L ${width*0.8} 0
              L ${width*0.9} ${height*0.5}
              L ${width*0.7} ${height}
              L ${width*0.3} ${height}
              L ${width*0.1} ${height*0.5}
              Z`;
    case 'leftArm':
    case 'rightArm':
      return `M ${width*0.3} 0
              L ${width*0.7} 0
              L ${width*0.8} ${height*0.9}
              L ${width*0.2} ${height*0.9}
              Z`;
    default:
      return `M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} Z`;
  }
};

const CharacterRig: React.FC<CharacterRigProps> = ({
  character,
  onJointChange,
  onPositionChange,
  onPartDragStart,
  onPartDragEnd,
  isDragging,
  showJoints = false,
  lampBrightness,
}) => {
  const containerRef = useRef<SVGGElement>(null);
  const lastUpdateRef = useRef<number>(0);
  
  const brightness = useMemo(() => {
    return 1.8 - (lampBrightness - 0.3) * (1.2 / 1.5);
  }, [lampBrightness]);
  
  const contrast = useMemo(() => {
    return 2.3 - (lampBrightness - 0.3) * (1.5 / 1.5);
  }, [lampBrightness]);
  
  const clampAngle = useCallback((angle: number, type: JointType): number => {
    const limits = JOINT_LIMITS[type];
    return Math.max(limits.min, Math.min(limits.max, angle));
  }, []);
  
  const handleJointDrag = useCallback((jointId: string, deltaAngle: number) => {
    const now = performance.now();
    if (now - lastUpdateRef.current < 16) return;
    lastUpdateRef.current = now;
    
    const joint = character.joints.find(j => j.id === jointId);
    if (!joint || !onJointChange) return;
    
    const newAngle = clampAngle(joint.angle + deltaAngle, joint.type);
    onJointChange(character.id, jointId, newAngle);
  }, [character.id, character.joints, onJointChange, clampAngle]);
  
  const getPartTransform = useCallback((part: CharacterPart): string => {
    let rotation = part.rotation;
    
    if (part.type === 'head') {
      const neckJoint = character.joints.find(j => j.type === 'head');
      if (neckJoint) rotation = neckJoint.angle;
    } else if (part.type === 'leftArm') {
      const shoulder = character.joints.find(j => j.id.includes('leftShoulder'));
      if (shoulder) rotation = shoulder.angle - 90;
    } else if (part.type === 'rightArm') {
      const shoulder = character.joints.find(j => j.id.includes('rightShoulder'));
      if (shoulder) rotation = shoulder.angle + 90;
    }
    
    return `translate(${part.x - part.width / 2}, ${part.y - part.height / 2}) rotate(${rotation}, ${part.width / 2}, ${part.height / 2})`;
  }, [character.joints]);
  
  return (
    <g
      ref={containerRef}
      transform={`translate(${character.position.x}, ${character.position.y})`}
      style={{
        filter: `brightness(${brightness}) contrast(${contrast})`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {character.parts.map(part => (
        <motion.g
          key={part.id}
          transform={getPartTransform(part)}
          drag={!isDragging}
          dragMomentum={false}
          onDragStart={() => onPartDragStart?.(part.id)}
          onDragEnd={(e, info) => onPartDragEnd?.(part.id, info.point.x, info.point.y)}
          whileHover={{ scale: 1.02 }}
          style={{ transition: 'transform 0.08s ease-out' }}
        >
          <path
            d={renderPartPath(part.type, part.width, part.height)}
            fill={part.color}
            fillOpacity={0.85}
            stroke="#1a1a1a"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <path
            d={renderPartPath(part.type, part.width, part.height)}
            fill="none"
            stroke="rgba(0,0,0,0.2)"
            strokeWidth={1}
            strokeDasharray="3,2"
            transform="translate(2, 2)"
          />
        </motion.g>
      ))}
      
      {character.joints.map(joint => (
        <g key={joint.id}>
          <motion.circle
            cx={joint.x}
            cy={joint.y}
            r={8}
            fill="#fff8e1"
            stroke="#5d4037"
            strokeWidth={2}
            drag
            dragMomentum={false}
            onDrag={(e, info) => {
              const angle = Math.atan2(info.offset.y, info.offset.x) * (180 / Math.PI);
              handleJointDrag(joint.id, info.offset.x * 0.5);
            }}
            whileHover={{ scale: 1.3, fill: '#fff3e0' }}
            whileDrag={{ scale: 1.5 }}
            style={{ cursor: 'pointer' }}
          />
          {showJoints && (
            <text
              x={joint.x}
              y={joint.y - 15}
              textAnchor="middle"
              fill="#fff"
              fontSize={10}
            >
              {Math.round(joint.angle)}°
            </text>
          )}
        </g>
      ))}
      
      <circle
        cx={0}
        cy={-60}
        r={5}
        fill="#ffd54f"
        stroke="#5d4037"
        strokeWidth={2}
      />
    </g>
  );
};

export default CharacterRig;
