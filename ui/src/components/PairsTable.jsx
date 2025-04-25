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
  console.log(pairs)
  return (
    <table className="pairs-table">
      <thead>
        <tr>
          <th>Peers</th>
          <th>Success Rate</th>
        </tr>
      </thead>
      <tbody>
        {pairs.map((pair) => (
          <tr
            key={pair.id}
            className={selectedPairId === pair.pair_id ? "selected" : ""}
            onClick={() => onSelect(pair)}
            style={{ cursor: "pointer" }}
          >
            <td>{pair.id}</td>
            <td>
              <span
                style={{
                  color: getSuccessColor(pair.rate),
                  fontWeight: pair.rate < 0.2 ? "bold" : "normal",
                }}
              >
                {pair.rate !== null && pair.rate !== undefined
                  ? `${Math.round(pair.rate * 100)}%`
                  : "N/A"}
              </span>
            </td>
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
