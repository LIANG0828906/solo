import SwaggerParser from '@apidevtools/swagger-parser';

export async function parseOpenAPI(specContent) {
  try {
    const api = await SwaggerParser.validate(specContent);
    
    const result = {
      info: {
        title: api.info?.title || 'API Documentation',
        description: api.info?.description || '',
        version: api.info?.version || '1.0.0'
      },
      servers: api.servers || [],
      tags: [],
      paths: []
    };

    const tagMap = new Map();
    if (api.tags) {
      api.tags.forEach(tag => {
        tagMap.set(tag.name, { name: tag.name, description: tag.description || '' });
      });
    }

    const paths = [];
    
    if (api.paths) {
      for (const [path, methods] of Object.entries(api.paths)) {
        for (const [method, operation] of Object.entries(methods)) {
          if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
            const operationObj = operation;
            const tags = operationObj.tags || ['default'];
            
            tags.forEach(tagName => {
              if (!tagMap.has(tagName)) {
                tagMap.set(tagName, { name: tagName, description: '' });
              }
            });

            const parameters = [];
            
            if (operationObj.parameters) {
              operationObj.parameters.forEach(param => {
                parameters.push({
                  name: param.name,
                  in: param.in,
                  type: param.schema?.type || 'string',
                  required: param.required || false,
                  description: param.description || '',
                  example: param.example ?? param.schema?.example ?? null
                });
              });
            }

            const pathParameters = (methods.parameters || []).map(param => ({
              name: param.name,
              in: param.in,
              type: param.schema?.type || 'string',
              required: param.required || true,
              description: param.description || '',
              example: param.example ?? param.schema?.example ?? null
            }));

            const allParams = [...pathParameters, ...parameters];

            const requestBody = operationObj.requestBody 
              ? parseRequestBody(operationObj.requestBody) 
              : null;

            const responses = {};
            if (operationObj.responses) {
              for (const [statusCode, response] of Object.entries(operationObj.responses)) {
                responses[statusCode] = parseResponse(response);
              }
            }

            paths.push({
              path,
              method: method.toUpperCase(),
              operationId: operationObj.operationId || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
              summary: operationObj.summary || '',
              description: operationObj.description || '',
              tags,
              parameters: allParams,
              requestBody,
              responses
            });
          }
        }
      }
    }

    result.tags = Array.from(tagMap.values());
    result.paths = paths;

    return result;
  } catch (error) {
    throw new Error(`解析 OpenAPI 规范失败: ${error.message}`);
  }
}

function parseRequestBody(requestBody) {
  const result = {
    description: requestBody.description || '',
    required: requestBody.required || false,
    content: {}
  };

  if (requestBody.content) {
    for (const [mediaType, mediaTypeObj] of Object.entries(requestBody.content)) {
      result.content[mediaType] = {
        schema: parseSchema(mediaTypeObj.schema),
        example: mediaTypeObj.example || null
      };
    }
  }

  return result;
}

function parseResponse(response) {
  const result = {
    description: response.description || '',
    content: {}
  };

  if (response.content) {
    for (const [mediaType, mediaTypeObj] of Object.entries(response.content)) {
      result.content[mediaType] = {
        schema: parseSchema(mediaTypeObj.schema),
        example: mediaTypeObj.example || null
      };
    }
  }

  return result;
}

function parseSchema(schema) {
  if (!schema) return null;

  const result = {
    type: schema.type || 'object',
    description: schema.description || '',
    example: schema.example || null
  };

  if (schema.type === 'object' && schema.properties) {
    result.properties = {};
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      result.properties[propName] = parseSchema(propSchema);
    }
    result.required = schema.required || [];
  }

  if (schema.type === 'array' && schema.items) {
    result.items = parseSchema(schema.items);
  }

  if (schema.enum) {
    result.enum = schema.enum;
  }

  if (schema.format) {
    result.format = schema.format;
  }

  if (schema.$ref) {
    result.$ref = schema.$ref;
  }

  return result;
}
