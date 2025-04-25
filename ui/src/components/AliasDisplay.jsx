import React from "react";
import PropTypes from "prop-types";
// Styling from dashboard.css

export default function AliasDisplay({ alias, pubkey }) {
  if (alias) return <span className="alias-display">{alias}</span>;
  if (pubkey) return (
    <span className="alias-display" title={pubkey}>
      {pubkey.slice(0, 6)}...{pubkey.slice(-4)}
    </span>
  );
  return <span className="alias-display">Unknown</span>;
}

AliasDisplay.propTypes = {
  alias: PropTypes.string,
  pubkey: PropTypes.string,
};
