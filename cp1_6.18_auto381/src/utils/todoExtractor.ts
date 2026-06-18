import type { ExtractedTodo } from '../types';

const TODO_REGEX = /^- \[([ x])\] (.+)$/gm;

export function extractTodos(markdown: string): ExtractedTodo[] {
  if (typeof markdown !== 'string') {
    throw new TypeError('markdown must be a string');
  }

  const todos: ExtractedTodo[] = [];
  let match: RegExpExecArray | null;

  TODO_REGEX.lastIndex = 0;

  while ((match = TODO_REGEX.exec(markdown)) !== null) {
    const [, status, description] = match;
    const completed = status.toLowerCase() === 'x';
    const trimmedDescription = description.trim();

    if (trimmedDescription) {
      todos.push({
        description: trimmedDescription,
        completed,
      });
    }
  }

  return todos;
}

export function extractTodosAsync(markdown: string): Promise<ExtractedTodo[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(extractTodos(markdown));
    }, 0);
  });
}
