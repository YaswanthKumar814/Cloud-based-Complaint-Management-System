/** Format ISO date for display */
export function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };

/** Sort complaints: HIGH priority first, then newest */
export function sortByPriority(items) {
  return [...items].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 9;
    const pb = PRIORITY_ORDER[b.priority] ?? 9;
    if (pa !== pb) return pa - pb;
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });
}
