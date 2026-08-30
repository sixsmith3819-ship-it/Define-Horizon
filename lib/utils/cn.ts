// lib/utils/cn.ts
export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes
    .filter((c) => typeof c === 'string')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
