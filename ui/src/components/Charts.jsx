import React from "react";
import PropTypes from "prop-types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList,
} from "recharts";

export default function Charts({ data, type = "distribution", label }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="charts-placeholder">[Chart: {type} — No data]</div>;
  }

  // Distribution histogram for success rates (0-1 bucketed)
  if (type === "distribution") {
    // Bucket into 10 bins (0-0.1, 0.1-0.2, ... 0.9-1.0)
    const bins = Array.from({ length: 10 }, (_, i) => ({
      bin: `${(i * 10)}-${(i + 1) * 10}%`,
      count: 0,
    }));
    data.forEach((val) => {
      if (typeof val === "number" && !isNaN(val)) {
        const idx = Math.min(Math.floor(val * 10), 9);
        bins[idx].count += 1;
      }
    });
    return (
      <div className="charts-placeholder" style={{ background: "#fafbfc", padding: 8 }}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>{label || "Success Rate Distribution"}</div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={bins} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bin" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#1976d2">
              <LabelList dataKey="count" position="top" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Success vs Fail bar chart
  if (type === "bar" && data.length === 2) {
    const barData = [
      { name: "Success", value: data[0] },
      { name: "Fail", value: data[1] },
    ];
    return (
      <div className="charts-placeholder" style={{ background: "#fafbfc", padding: 8 }}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>{label || "Success vs Fail"}</div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={barData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
            <Tooltip />
            <Bar dataKey="value" fill="#43a047">
              <LabelList dataKey="value" position="right" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Fallback: simple list
  return (
    <div className="charts-placeholder">[Chart: {type} — Data: {JSON.stringify(data)}]</div>
  );
}

Charts.propTypes = {
  data: PropTypes.array,
  type: PropTypes.string,
  label: PropTypes.string,
};
