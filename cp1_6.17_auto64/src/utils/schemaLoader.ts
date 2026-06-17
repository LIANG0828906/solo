import type { JSONSchema } from '@/types/schema';

export async function loadSchemaFromFile(file: File): Promise<JSONSchema> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const schema = JSON.parse(content) as JSONSchema;
        resolve(schema);
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function loadMockSchema(name: string): JSONSchema {
  const schemas: Record<string, JSONSchema> = {
    'user-v1.json': {
      title: 'User Schema v1',
      type: 'object',
      required: ['id', 'name', 'email'],
      properties: {
        id: { type: 'number', description: '用户唯一标识' },
        name: { type: 'string', description: '用户姓名' },
        email: { type: 'string', description: '用户邮箱' },
        age: { type: 'number', description: '用户年龄' },
        address: {
          type: 'object',
          title: 'Address',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            zipCode: { type: 'string' },
          },
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
        isActive: { type: 'boolean', default: true },
      },
    },
    'user-v2.json': {
      title: 'User Schema v2',
      type: 'object',
      required: ['id', 'name', 'email', 'phone'],
      properties: {
        id: { type: 'number', description: '用户唯一标识' },
        name: { type: 'string', description: '用户全名' },
        email: { type: 'string', description: '用户邮箱' },
        phone: { type: 'string', description: '用户手机号' },
        address: {
          type: 'object',
          title: 'Address',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string', description: '省份' },
            zipCode: { type: 'number', description: '邮政编码' },
          },
        },
        tags: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              color: { type: 'string' },
            },
          },
        },
        isActive: { type: 'boolean', default: true },
        role: {
          type: 'string',
          enum: ['admin', 'user', 'guest'],
          default: 'user',
        },
      },
    },
    'product.json': {
      title: 'Product Schema',
      type: 'object',
      required: ['id', 'name', 'price'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        price: { type: 'number' },
        description: { type: 'string' },
        category: { type: 'string' },
        stock: {
          type: 'object',
          properties: {
            quantity: { type: 'number' },
            warehouse: { type: 'string' },
          },
        },
        images: {
          type: 'array',
          items: { type: 'string' },
        },
        isAvailable: { type: 'boolean' },
      },
    },
  };

  return schemas[name] || {
    title: 'Unknown Schema',
    type: 'object',
    properties: {},
  };
}

export function getAvailableMockSchemas(): string[] {
  return ['user-v1.json', 'user-v2.json', 'product.json'];
}
