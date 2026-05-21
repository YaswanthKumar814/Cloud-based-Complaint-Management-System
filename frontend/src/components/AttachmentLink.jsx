import { useState } from 'react';
import { getPresignedDownloadUrl } from '../api/uploadApi.js';

/**
 * Opens attachment in a new tab using a short-lived presigned GET URL.
 * Direct S3 URLs fail with AccessDenied on private buckets.
 */
export default function AttachmentLink({ fileKey }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleView() {
    setLoading(true);
    setError(null);
    try {
      const url = await getPresignedDownloadUrl(fileKey);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="attachment-wrap">
      <button
        type="button"
        className="link-button"
        onClick={() => void handleView()}
        disabled={loading}
      >
        {loading ? 'Opening…' : 'View attachment'}
      </button>
      {error && <span className="error-inline"> {error}</span>}
    </span>
  );
}
