/**
 * Formats a date for display in Chinese locale.
 * Example: 2022-06-29 → "2022年6月29日"
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formats a date in ISO-like format for RSS feeds.
 * Example: "2022-06-29"
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}
