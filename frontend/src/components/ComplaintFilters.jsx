/** Simple search + status filter + priority sort (optional, beginner-friendly) */
export default function ComplaintFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortByPriority,
  onSortByPriorityChange,
  totalCount,
  visibleCount,
}) {
  return (
    <div className="filters">
      <input
        type="search"
        className="input-search"
        placeholder="Search title or description…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select
        className="select"
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
      >
        <option value="">All statuses</option>
        <option value="Pending">Pending</option>
        <option value="In Progress">In Progress</option>
        <option value="Resolved">Resolved</option>
        <option value="Rejected">Rejected</option>
      </select>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={sortByPriority}
          onChange={(e) => onSortByPriorityChange(e.target.checked)}
        />
        Sort by priority (HIGH first)
      </label>
      <span className="filter-count">
        Showing {visibleCount} of {totalCount}
      </span>
    </div>
  );
}
