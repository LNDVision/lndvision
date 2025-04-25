import React from "react";
import PropTypes from "prop-types";
// Styling from dashboard.css

// Helper for color coding success rate
function getSuccessColor(rate) {
  if (rate === null || rate === undefined) return "gray";
  if (rate >= 0.8) return "#4caf50"; // green
  if (rate >= 0.5) return "#ff9800"; // orange
  return "#f44336"; // red
}

export default function PairsTable({ pairs, onSelect, selectedPairId }) {
  return (
    <table className="pairs-table">
      <thead>
        <tr>
          <th>Peer</th>
          <th>Success Rate</th>
          <th>Success Amt (sat)</th>
          <th>Fail Amt (sat)</th>
          <th>Last Success</th>
        </tr>
      </thead>
      <tbody>
        {pairs.map((pair) => (
          <tr
            key={pair.pair_id}
            className={selectedPairId === pair.pair_id ? "selected" : ""}
            onClick={() => onSelect(pair)}
            style={{ cursor: "pointer" }}
          >
            <td>{pair.alias || pair.peer || pair.pair_id}</td>
            <td>
              <span
                style={{
                  color: getSuccessColor(pair.success_rate),
                  fontWeight: pair.success_rate < 0.2 ? "bold" : "normal",
                }}
              >
                {pair.success_rate !== null && pair.success_rate !== undefined
                  ? `${Math.round(pair.success_rate * 100)}%`
                  : "N/A"}
              </span>
            </td>
            <td>{pair.success_amt_sat}</td>
            <td>{pair.fail_amt_sat}</td>
            <td>{pair.last_success_time ? new Date(pair.last_success_time).toLocaleString() : "N/A"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

PairsTable.propTypes = {
  pairs: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSelect: PropTypes.func.isRequired,
  selectedPairId: PropTypes.string,
};
