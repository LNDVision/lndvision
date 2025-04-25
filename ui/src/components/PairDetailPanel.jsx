import React from "react";
import PropTypes from "prop-types";
// Styling from dashboard.css

export default function PairDetailPanel({ pair }) {
  if (!pair) {
    return <div className="pair-detail-panel">Select a pair to see details.</div>;
  }
  return (
    <div className="pair-detail-panel">
      <h2>Pair Details</h2>
      <div><b>Peer:</b> {pair.id}</div>
      <div><b>Success Rate:</b> {pair.rate !== null && pair.rate !== undefined ? `${Math.round(pair.rate * 100)}%` : "N/A"}</div>
      <div><b>Success Amt (sat):</b> {pair.success_amt_sat}</div>
      <div><b>Fail Amt (sat):</b> {pair.fail_amt_sat}</div>
      <div><b>Last Success:</b> {pair.last_success_time ? new Date(pair.last_success_time).toLocaleString() : "N/A"}</div>
      {/* Placeholder for charts and prediction tool */}
      <div style={{ marginTop: 16, color: '#888' }}>[Charts and prediction tool will appear here]</div>
    </div>
  );
}

PairDetailPanel.propTypes = {
  pair: PropTypes.object,
};
