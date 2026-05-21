import { useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { createComplaint } from '../api/complaintsApi.js';
import { getPresignedUploadUrl, uploadFileToS3 } from '../api/uploadApi.js';
import { getUserEmail } from '../auth/roles.js';
import { resolveContentType } from '../utils/fileType.js';

const CATEGORIES = ['Hostel', 'Internet', 'Electrical', 'Cleanliness', 'Infrastructure', 'Other'];

/**
 * User complaint submission: optional S3 file + POST /api/complaints with userEmail.
 */
export default function ComplaintForm({ onCreated }) {
  const auth = useAuth();
  const userEmail = getUserEmail(auth);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Hostel');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setUploadStatus('');

    try {
      let fileUrl;
      let fileKey;

      if (file) {
        const contentType = resolveContentType(file);

        setUploadStatus('Getting upload link from server…');
        const presign = await getPresignedUploadUrl(file.name, contentType);

        setUploadStatus('Uploading file to S3…');
        await uploadFileToS3(presign.uploadUrl, file, presign.contentType || contentType);

        fileUrl = presign.fileUrl;
        fileKey = presign.fileKey;
        setUploadStatus('File uploaded. Saving complaint…');
      }

      await createComplaint({
        title: title.trim(),
        description: description.trim(),
        category,
        userEmail,
        ...(fileUrl && fileKey ? { fileUrl, fileKey } : {}),
      });

      setTitle('');
      setDescription('');
      setCategory('Hostel');
      setFile(null);
      setSuccess('Complaint submitted successfully.');
      setUploadStatus('');
      onCreated?.();
    } catch (err) {
      setError(err.message);
      setUploadStatus('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="complaint-form-section">
      <h2 className="section-title">Submit a complaint</h2>
      <form className="complaint-form" onSubmit={(e) => void handleSubmit(e)}>
        <label>
          Title
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Water leakage in room"
          />
        </label>

        <label>
          Description
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail"
          />
        </label>

        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label>
          Attachment (optional — PNG, JPG, WEBP, PDF)
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
        {error && <p className="error-inline">{error}</p>}
        {success && <p className="success-inline">{success}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Please wait…' : 'Submit complaint'}
        </button>
      </form>
    </section>
  );
}
