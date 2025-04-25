import React from "react";
import PropTypes from "prop-types";
// Styling from dashboard.css

export default function FiltersPanel({ filters, onChange, onClear }) {
  return (
    <div className="filters-panel">
      <input
        type="text"
        placeholder="Search by alias or pubkey"
        value={filters.search || ""}
        onChange={e => onChange({ ...filters, search: e.target.value })}
        style={{ marginRight: 8 }}
      />
      <label style={{ marginRight: 8 }}>
        Min Success Rate %:
        <input
          type="number"
          min={0}
          max={100}
          value={filters.minSuccessRate || ""}
          onChange={e => onChange({ ...filters, minSuccessRate: e.target.value })}
          style={{ width: 60, marginLeft: 4 }}
        />
      </label>
      <label style={{ marginRight: 8 }}>
        Max Failures:
        <input
          type="number"
          min={0}
          value={filters.maxFailures || ""}
          onChange={e => onChange({ ...filters, maxFailures: e.target.value })}
          style={{ width: 60, marginLeft: 4 }}
        />
      </label>
      <button onClick={onClear} style={{ marginLeft: 8 }}>Clear Filters</button>
    </div>
  );
}

FiltersPanel.propTypes = {
  filters: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};
