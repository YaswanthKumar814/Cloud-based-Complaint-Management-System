import Badge from './Badge.jsx';
import AttachmentLink from './AttachmentLink.jsx';
import { formatDate } from '../utils/format.js';

/** Read-only complaint card for normal users (no status update). */
export default function UserComplaintCard({ complaint }) {
  const keyPhrases = Array.isArray(complaint.keyPhrases) ? complaint.keyPhrases : [];

  return (
    <article className="complaint-card complaint-card-readonly">
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
          <dt>Created</dt>
          <dd>{formatDate(complaint.createdAt)}</dd>
        </div>
        <div>
          <dt>Your category</dt>
          <dd>{complaint.category ?? '—'}</dd>
        </div>
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
    </article>
  );
}
