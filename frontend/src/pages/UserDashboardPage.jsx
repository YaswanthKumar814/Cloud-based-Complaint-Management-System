import { useCallback, useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { fetchComplaints } from '../api/complaintsApi.js';
import { getUserEmail } from '../auth/roles.js';
import UserHeader from '../components/UserHeader.jsx';
import ComplaintForm from '../components/ComplaintForm.jsx';
import UserComplaintCard from '../components/UserComplaintCard.jsx';

/**
 * Normal user dashboard: submit complaints + view only their own.
 */
export default function UserDashboardPage() {
  const auth = useAuth();
  const userEmail = getUserEmail(auth);

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMyComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplaints({ userEmail });
      setComplaints(data);
    } catch (err) {
      setError(err.message);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    loadMyComplaints();
  }, [loadMyComplaints]);

  return (
    <div className="dashboard">
      <UserHeader title="My Complaints" />

      <ComplaintForm onCreated={loadMyComplaints} />

      <h2 className="section-title">Your submitted complaints</h2>

      {loading && (
        <div className="state-box loading-box">
          <p>Loading your complaints…</p>
        </div>
      )}

      {!loading && error && (
        <div className="state-box error-box">
          <p className="error">{error}</p>
          <button type="button" onClick={() => void loadMyComplaints()}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && complaints.length === 0 && (
        <div className="state-box">
          <p>You have not submitted any complaints yet. Use the form above.</p>
        </div>
      )}

      {!loading && !error && complaints.length > 0 && (
        <div className="complaint-list">
          {complaints.map((c) => (
            <UserComplaintCard key={c.complaintId} complaint={c} />
          ))}
        </div>
      )}
    </div>
  );
}
