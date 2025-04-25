import React, { useState } from "react";
import PropTypes from "prop-types";
// Styling from dashboard.css

export default function PredictionTool({ pairId, onPredict }) {
  const [amount, setAmount] = useState(100000);
  const [secsSinceLastSuccess, setSecsSinceLastSuccess] = useState(3600);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pair_id: pairId, amount_sats: amount, secs_since_last_success: secsSinceLastSuccess }),
      });
      if (!res.ok) throw new Error("Prediction failed");
      const data = await res.json();
      setResult(data.success_probability);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="prediction-tool">
      <h3>Route Prediction Tool</h3>
      <form onSubmit={handleSubmit}>
        <label>
          Amount (sats):
          <input type="number" min={1} value={amount} onChange={e => setAmount(Number(e.target.value))} />
        </label>
        <label style={{ marginLeft: 8 }}>
          Seconds Since Last Success:
          <input type="number" min={0} value={secsSinceLastSuccess} onChange={e => setSecsSinceLastSuccess(Number(e.target.value))} />
        </label>
        <button type="submit" disabled={loading} style={{ marginLeft: 8 }}>Predict</button>
      </form>
      {loading && <div>Loading...</div>}
      {result !== null && <div style={{ marginTop: 8 }}><b>Predicted Success Probability:</b> {Math.round(result * 100)}%</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
}

PredictionTool.propTypes = {
  pairId: PropTypes.string.isRequired,
  onPredict: PropTypes.func,
};
