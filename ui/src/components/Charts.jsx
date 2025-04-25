import React from "react";
import PropTypes from "prop-types";
// Styling from dashboard.css

export default function Charts({ data, type = "line", label }) {
  // Show a simple SVG chart if data is present, else placeholder
  if (Array.isArray(data) && data.length > 1) {
    // Normalize data for SVG
    const values = data.map(d => typeof d === "number" ? d : d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const w = 220, h = 60, pad = 6;
    const points = values.map((v, i) => {
      const x = pad + (w - 2 * pad) * (i / (values.length - 1));
      const y = pad + (h - 2 * pad) * (1 - (v - min) / (max - min || 1));
      return `${x},${y}`;
    }).join(" ");
    return (
      <div className="charts-placeholder" style={{ background: "#fafbfc" }}>
        <svg width={w} height={h} style={{ display: "block", margin: "0 auto" }}>
          <polyline
            fill="none"
            stroke="#1976d2"
            strokeWidth="2"
            points={points}
          />
        </svg>
        {label && <div style={{ color: "#333", fontSize: 13 }}>{label}</div>}
      </div>
    );
  }
  return (
    <div className="charts-placeholder">
      [Chart: {type} — No data]
    </div>
  );
}

Charts.propTypes = {
  data: PropTypes.array,
  type: PropTypes.string,
  label: PropTypes.string,
};
