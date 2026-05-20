/**
 * Small colored label for status / priority / sentiment.
 * CSS classes defined in index.css
 */
export default function Badge({ label, type = 'default' }) {
  if (!label) return null;
  const slug = String(label).toLowerCase().replace(/\s+/g, '-');
  return (
    <span className={`badge badge-${type} badge-${slug}`}>
      {label}
    </span>
  );
}
