import React from "react";
import PropTypes from "prop-types";
// Styling from dashboard.css

export default function NotificationBadge({ count, label, onClick }) {
  if (!count || count <= 0) return null;
  return (
    <span
      className="notification-badge"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      title={label}
    >
      ⚠️ {count} {label}
    </span>
  );
}

NotificationBadge.propTypes = {
  count: PropTypes.number.isRequired,
  label: PropTypes.string,
  onClick: PropTypes.func,
};
