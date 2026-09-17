export function formatRelativeTime(
  date: Date | string,
  t?: (key: string, options?: any) => string
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffSeconds = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));

  if (diffSeconds < 60) {
    return t
      ? t('notifications.timeAgo.justNow', { defaultValue: 'hace un momento' })
      : 'hace un momento';
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) {
    return t
      ? t('notifications.timeAgo.minutesAgo', { count: diffMinutes, defaultValue: `hace ${diffMinutes} min` })
      : `hace ${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return t
      ? t('notifications.timeAgo.hoursAgo', { count: diffHours, defaultValue: `hace ${diffHours} h` })
      : `hace ${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return t
    ? t('notifications.timeAgo.daysAgo', { count: diffDays, defaultValue: `hace ${diffDays} d` })
    : `hace ${diffDays} d`;
}
