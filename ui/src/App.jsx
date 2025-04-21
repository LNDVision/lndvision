import React, { useState, useEffect } from 'react';
import axios from 'axios';
function App() {
  const [pairs, setPairs] = useState([]);
  useEffect(() => {
    axios.get('http://localhost:8000/pairs')  // add endpoint later
      .then(r => setPairs(r.data));
  }, []);
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Mission‑Control Explorer</h1>
      <table className="table-auto">
        <thead><tr><th>Pair</th><th>Success %</th></tr></thead>
        <tbody>
          {pairs.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td className={p.rate>0.9? "text-green-500":"text-red-500"}>{(p.rate*100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default App;
