const firstNameSamples = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王小明'];
const lastNameSamples = ['张', '李', '王', '赵', '钱', '孙', '周', '吴', '郑', '冯'];
const emailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'qq.com', '163.com', 'example.com'];
const cityNames = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆'];
const statusValues = ['active', 'inactive', 'pending', 'deleted', 'draft', 'published'];
const wordSamples = ['用户', '订单', '产品', '项目', '任务', '消息', '通知', '配置', '日志', '报告'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomBoolean() {
  return Math.random() > 0.5;
}

function randomPick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateMockValueBySchema(schema, propertyName = '') {
  if (!schema) {
    return 'mock_value';
  }

  if (schema.example !== null && schema.example !== undefined) {
    return schema.example;
  }

  if (schema.enum && schema.enum.length > 0) {
    return randomPick(schema.enum);
  }

  const type = schema.type || 'string';
  const format = schema.format;

  if (type === 'string') {
    if (format === 'email' || propertyName.toLowerCase().includes('email')) {
      return `${randomString(8).toLowerCase()}@${randomPick(emailDomains)}`;
    }
    if (format === 'uuid') {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    if (format === 'date-time' || format === 'date' || propertyName.toLowerCase().includes('time') || propertyName.toLowerCase().includes('date')) {
      const date = new Date();
      date.setDate(date.getDate() - randomInt(0, 365));
      return format === 'date' ? date.toISOString().split('T')[0] : date.toISOString();
    }
    if (format === 'uri' || format === 'url') {
      return `https://example.com/${randomString(8).toLowerCase()}`;
    }
    if (propertyName.toLowerCase().includes('name') || propertyName.toLowerCase().includes('title')) {
      return randomPick(firstNameSamples);
    }
    if (propertyName.toLowerCase().includes('city')) {
      return randomPick(cityNames);
    }
    if (propertyName.toLowerCase().includes('status') || propertyName.toLowerCase().includes('state')) {
      return randomPick(statusValues);
    }
    if (propertyName.toLowerCase().includes('id')) {
      return randomString(12);
    }
    return randomPick(wordSamples) + randomInt(1, 100);
  }

  if (type === 'integer' || type === 'number') {
    const min = schema.minimum ?? 0;
    const max = schema.maximum ?? 1000;
    if (type === 'integer') {
      return randomInt(min, max);
    }
    return randomFloat(min, max);
  }

  if (type === 'boolean') {
    return randomBoolean();
  }

  if (type === 'array') {
    const items = schema.items || { type: 'string' };
    const count = randomInt(1, 5);
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(generateMockValueBySchema(items, ''));
    }
    return result;
  }

  if (type === 'object') {
    return generateMockObject(schema);
  }

  return null;
}

function generateMockObject(schema) {
  const result = {};
  
  if (!schema || !schema.properties) {
    return {};
  }

  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    result[propName] = generateMockValueBySchema(propSchema, propName);
  }

  return result;
}

export function generateMockData(apiDoc, path, method, params = {}) {
  const api = apiDoc.paths.find(
    p => p.path === path && p.method === method.toUpperCase()
  );

  if (!api) {
    return {
      statusCode: 404,
      data: { error: 'API not found', message: `No API found for ${method} ${path}` }
    };
  }

  const successResponses = ['200', '201', '202', '204'];
  let responseSchema = null;
  let statusCode = 200;

  for (const code of successResponses) {
    if (api.responses[code]) {
      statusCode = parseInt(code, 10);
      responseSchema = api.responses[code];
      break;
    }
  }

  if (!responseSchema) {
    const allCodes = Object.keys(api.responses);
    if (allCodes.length > 0) {
      statusCode = parseInt(allCodes[0], 10);
      responseSchema = api.responses[allCodes[0]];
    }
  }

  let mockData = null;

  if (responseSchema && responseSchema.content) {
    const jsonContent = responseSchema.content['application/json'];
    if (jsonContent && jsonContent.schema) {
      mockData = generateMockValueBySchema(jsonContent.schema, '');
    }
  }

  return {
    statusCode,
    data: mockData,
    headers: {
      'Content-Type': 'application/json',
      'X-Mock-Server': 'api-doc-mock'
    }
  };
}

export function generateAllMockData(apiDoc) {
  const result = {};
  
  apiDoc.paths.forEach(api => {
    const key = `${api.method} ${api.path}`;
    result[key] = generateMockData(apiDoc, api.path, api.method);
  });

  return result;
}
