import { useState } from 'react';
import Badge from './Badge.jsx';
import AttachmentLink from './AttachmentLink.jsx';
import { formatDate } from '../utils/format.js';
import { updateComplaintStatus } from '../api/complaintsApi.js';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

/**
 * One complaint card with AI info, attachment link, and status update.
 */
export default function ComplaintCard({ complaint, onUpdated }) {
  const [status, setStatus] = useState(complaint.status);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  const keyPhrases = Array.isArray(complaint.keyPhrases)
    ? complaint.keyPhrases
    : [];

  async function handleStatusUpdate() {
    if (status === complaint.status) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      const updated = await updateComplaintStatus(complaint.complaintId, status);
      onUpdated(updated);
    } catch (err) {
      setUpdateError(err.message);
      setStatus(complaint.status);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <article className="complaint-card">
      <div className="complaint-card-header">
        <h2 className="complaint-title">{complaint.title}</h2>
        <div className="badge-row">
          <Badge label={complaint.status} type="status" />
          <Badge label={complaint.priority} type="priority" />
          <Badge label={complaint.aiCategory} type="category" />
          <Badge label={complaint.sentiment} type="sentiment" />
        </div>
      </div>

      <p className="complaint-description">{complaint.description}</p>

      <dl className="complaint-meta">
        <div>
          <dt>Complaint ID</dt>
          <dd className="mono">{complaint.complaintId}</dd>
        </div>
        <div>
          <dt>User category</dt>
          <dd>{complaint.category ?? '—'}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatDate(complaint.createdAt)}</dd>
        </div>
        {complaint.updatedAt && (
          <div>
            <dt>Updated</dt>
            <dd>{formatDate(complaint.updatedAt)}</dd>
          </div>
        )}
      </dl>

      {keyPhrases.length > 0 && (
        <p className="key-phrases">
          <strong>Key phrases:</strong> {keyPhrases.join(', ')}
        </p>
      )}

      {complaint.fileKey && (
        <p>
          <AttachmentLink fileKey={complaint.fileKey} />
        </p>
      )}

      <div className="status-update">
        <label>
          Update status
          <select
            className="select"
            value={status}
            disabled={updating}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn-secondary"
          disabled={updating || status === complaint.status}
          onClick={() => void handleStatusUpdate()}
        >
          {updating ? 'Saving…' : 'Save status'}
        </button>
      </div>

      {updateError && <p className="error-inline">{updateError}</p>}
    </article>
  );
}
