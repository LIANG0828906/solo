import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import ChocolatePreview from '../ChocolatePreview';

vi.mock('three', () => {
  const mockMesh = {
    rotation: { y: 0 },
    position: { y: 0 },
  };
  const mockColor = vi.fn((hex: string) => ({
    lerp: vi.fn().mockReturnThis(),
  }));
  const mockShape = {
    moveTo: vi.fn().mockReturnThis(),
    bezierCurveTo: vi.fn().mockReturnThis(),
  };
  const mockExtrudeGeometry = vi.fn().mockImplementation(() => ({
    center: vi.fn().mockReturnThis(),
  }));
  const mockLatheGeometry = vi.fn().mockImplementation(() => ({
    center: vi.fn().mockReturnThis(),
  }));
  const mockCylinderGeometry = vi.fn();
  const mockVector2 = vi.fn((x: number, y: number) => ({ x, y }));
  const mockDataTexture = vi.fn().mockImplementation(() => ({
    needsUpdate: false,
  }));
  const mockMeshStandardMaterial = vi.fn();
  const mockMeshPhysicalMaterial = vi.fn();

  return {
    Mesh: vi.fn(),
    Shape: vi.fn(() => mockShape),
    ExtrudeGeometry: mockExtrudeGeometry,
    LatheGeometry: mockLatheGeometry,
    CylinderGeometry: mockCylinderGeometry,
    Vector2: mockVector2,
    DataTexture: mockDataTexture,
    MeshStandardMaterial: mockMeshStandardMaterial,
    MeshPhysicalMaterial: mockMeshPhysicalMaterial,
    Color: mockColor,
    RedFormat: 'RedFormat',
    useRef: vi.fn(() => ({ current: mockMesh })),
  };
});

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, style, camera }: any) => (
    <div data-testid="mock-canvas" style={style}>
      {children}
    </div>
  ),
  useFrame: vi.fn((callback: any) => {
    callback();
  }),
  useThree: vi.fn(() => ({ camera: {} })),
}));

vi.mock('@react-three/drei', () => ({
  RoundedBox: ({ args }: any) => <div data-testid="rounded-box" args={args} />,
  OrbitControls: (props: any) => <div data-testid="orbit-controls" {...props} />,
}));

describe('ChocolatePreview', () => {
  const shapes: Array<'circle' | 'square' | 'heart' | 'shell'> = ['circle', 'square', 'heart', 'shell'];
  const textures: Array<'matte' | 'glossy' | 'crushed-nuts' | 'gold-foil'> = ['matte', 'glossy', 'crushed-nuts', 'gold-foil'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe.each(shapes)('shape: %s', (shape) => {
    it(`should render without crashing for ${shape} shape`, () => {
      expect(() => {
        render(
          <ChocolatePreview
            shape={shape}
            color="#5D4037"
            texture="glossy"
          />
        );
      }).not.toThrow();
    });
  });

  describe.each(textures)('texture: %s', (texture) => {
    it(`should render with ${texture} texture`, () => {
      expect(() => {
        render(
          <ChocolatePreview
            shape="circle"
            color="#5D4037"
            texture={texture}
          />
        );
      }).not.toThrow();
    });
  });

  it('should render with custom size prop', () => {
    expect(() => {
      render(
        <ChocolatePreview
          shape="circle"
          color="#5D4037"
          texture="glossy"
          size={2}
        />
      );
    }).not.toThrow();
  });

  it('should render canvas with correct style', () => {
    const { container } = render(
      <ChocolatePreview
        shape="circle"
        color="#5D4037"
        texture="glossy"
      />
    );

    const canvas = container.querySelector('[data-testid="mock-canvas"]');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveStyle({
      width: '100%',
      height: '100%',
      borderRadius: '12px',
    });
  });
});
