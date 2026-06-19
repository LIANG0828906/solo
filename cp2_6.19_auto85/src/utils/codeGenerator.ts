const formatValue = (key: string, value: any): string => {
  if (typeof value === 'string') {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? `{true}` : `{false}`;
  }
  return String(value);
};

const getComponentName = (id: string): string => {
  const map: Record<string, string> = {
    button: 'Button',
    input: 'Input',
    card: 'Card',
    switch: 'Switch',
    tag: 'Tag',
  };
  return map[id] || 'Component';
};

export const generateCode = (componentId: string, props: Record<string, any>): string => {
  const componentName = getComponentName(componentId);
  const entries = Object.entries(props);
  
  if (entries.length === 0) {
    return `<${componentName} />`;
  }

  const propLines = entries.map(([key, value]) => {
    return `  ${key}=${formatValue(key, value)}`;
  });

  return `<${componentName}\n${propLines.join('\n')}\n/>`;
};
