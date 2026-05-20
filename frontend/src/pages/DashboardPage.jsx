import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchComplaints } from '../api/complaintsApi.js';
import { sortByPriority } from '../utils/format.js';
import UserHeader from '../components/UserHeader.jsx';
import ComplaintFilters from '../components/ComplaintFilters.jsx';
import ComplaintCard from '../components/ComplaintCard.jsx';
import { getApiBaseUrl } from '../api/client.js';

/**
 * Admin dashboard: lists complaints from Express API, filters, status updates.
 */
export default function DashboardPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortPriority, setSortPriority] = useState(true);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplaints();
      setComplaints(data);
    } catch (err) {
      setError(err.message);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const filtered = useMemo(() => {
    let list = [...complaints];
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q),
      );
    }

    if (statusFilter) {
      list = list.filter((c) => c.status === statusFilter);
    }

    if (sortPriority) {
      list = sortByPriority(list);
    } else {
      list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    }

    return list;
  }, [complaints, search, statusFilter, sortPriority]);

  function handleComplaintUpdated(updated) {
    setComplaints((prev) =>
      prev.map((c) => (c.complaintId === updated.complaintId ? updated : c)),
    );
  }

  return (
    <div className="dashboard">
      <UserHeader />

      <p className="api-hint">
        API: <code>{getApiBaseUrl()}</code> — ensure backend is running (<code>npm run dev</code> in project root).
      </p>

      <ComplaintFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortByPriority={sortPriority}
        onSortByPriorityChange={setSortPriority}
        totalCount={complaints.length}
        visibleCount={filtered.length}
      />

      {loading && (
        <div className="state-box loading-box">
          <p>Loading complaints…</p>
        </div>
      )}

      {!loading && error && (
        <div className="state-box error-box">
          <p className="error">{error}</p>
          <p className="error-hint">
            Common fix: start backend on port 5000 and check CORS. See docs/DASHBOARD.md.
          </p>
          <button type="button" onClick={() => void loadComplaints()}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="state-box">
          <p>No complaints found. Create one via Postman: POST /api/complaints</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="complaint-list">
          {filtered.map((c) => (
            <ComplaintCard
              key={c.complaintId}
              complaint={c}
              onUpdated={handleComplaintUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
