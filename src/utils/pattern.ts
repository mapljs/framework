export const normalizePattern = (pattern: string): string => pattern.length === 0 || pattern === '/' ? '/' : pattern.endsWith('/') ? pattern.slice(0, -1) : pattern;
