import React from "react";
import PropTypes from "prop-types";
// Styling from dashboard.css

export default function Layout({ header, filters, table, detail, notification }) {
  return (
    <div className="dashboard-layout">
      <header style={{ display: "flex", alignItems: "center", padding: 16, background: "#222", color: "#fff" }}>
        <h1 style={{ flex: 1, margin: 0, fontSize: 24 }}>Lightning Node Analytics</h1>
        {notification}
      </header>
      <div style={{ padding: 16 }}>
        {filters}
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 16 }}>
          <div style={{ flex: 2, minWidth: 320, marginRight: 16 }}>{table}</div>
          <div style={{ flex: 3, minWidth: 320 }}>{detail}</div>
        </div>
      </div>
    </div>
  );
}

Layout.propTypes = {
  header: PropTypes.node,
  filters: PropTypes.node,
  table: PropTypes.node,
  detail: PropTypes.node,
  notification: PropTypes.node,
};
