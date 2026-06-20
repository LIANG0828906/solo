import { ModelData } from '../types';

export const MODEL_LIST: ModelData[] = [
  {
    id: 'cube',
    name: '几何立方体',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMTYiIHk9IjE2IiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiNlOTQ1NjAiIGZpbGwtb3BhY2l0eT0iMC44Ii8+CjxyZWN0IHg9IjI0IiB5PSIyNCIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjMTYhE2JlIi8+Cjwvc3ZnPgo=',
    src: '/models/cube.glb',
    description: '基础立方体模型'
  },
  {
    id: 'sphere',
    name: '光滑球体',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDgiIGN5PSI0OCIgcj0iMzIiIGZpbGw9IiM0ZTZjZTUiIGZpbGwtb3BhY2l0eT0iMC44Ii8+Cjwv3N2Zz4K',
    src: '/models/sphere.glb',
    description: '高精度球体模型'
  },
  {
    id: 'torus',
    name: '圆环体',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGVsbGlwc2UgY3g9IjQ4IiBjeT0iNDgiIHJ4PSIzMiIgcnk9IjI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNiNjdlZmYiIHN0cm9rZS13aWR0aD0iOCIvPgo8L3N2Zz4K',
    src: '/models/torus.glb',
    description: '经典圆环几何'
  },
  {
    id: 'cylinder',
    name: '圆柱柱体',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMjgiIHk9IjE2IiB3aWR0aD0iNDAiIGhlaWdodD0iNjQiIGZpbGw9IiNhZGRjZDYiIGZpbGwtb3BhY2l0eT0iMC44Ii8+Cjwvc3ZnPgo=',
    src: '/models/cylinder.glb',
    description: '标准圆柱体模型'
  },
  {
    id: 'cone',
    name: '锥形尖塔',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBvbHlnb24gcG9pbnRzPSI0OCwxNiAxNiw4MCA4MCw4MCIgZmlsbD0iI2ZlYjY5MiIgZmlsbC1vcGFjaXR5PSIwLjgiLz4KPC9zdmc+Cg==',
    src: '/models/cone.glb',
    description: '锥形几何体'
  },
  {
    id: 'knot',
    name: '环形结',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQ4IDMwIEMzMCAzMCwgMjIgNDgsIDI2IDY0IEMzMCA3NywgNDggNzYsIDUwIDY0IEw1NCA1NiBDNTggNDYsIDU4IDQwLCA1MCAzNiBDNDQgMzMsIDM4IDM3LCAzOCA0NCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTk0NTYwIiBzdHJva2Utd2lkdGg9IjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K',
    src: '/models/knot.glb',
    description: '复杂环形结构'
  }
];

export const DEFAULT_MODEL_ID = 'cube';
